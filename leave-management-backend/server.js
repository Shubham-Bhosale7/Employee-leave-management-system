// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/leave_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
  department: String,
  leaveBalance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 10 },
    annual: { type: Number, default: 15 },
  },
  createdAt: { type: Date, default: Date.now },
});

// Leave Request Schema
const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, enum: ['casual', 'sick', 'annual'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedDate: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewDate: Date,
  comments: String,
});

const User = mongoose.model('User', userSchema);
const Leave = mongoose.model('Leave', leaveSchema);

// JWT Secret
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      department,
    });
    
    await user.save();
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        leaveBalance: user.leaveBalance,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        leaveBalance: user.leaveBalance,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Apply for leave
app.post('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Check leave balance
    if (user.leaveBalance[leaveType] < days) {
      return res.status(400).json({ message: 'Insufficient leave balance' });
    }
    
    const leave = new Leave({
      userId: req.user.id,
      leaveType,
      startDate,
      endDate,
      reason,
    });
    
    await leave.save();
    
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's leaves
// Add this route to test if server is working
app.get('/', (req, res) => {
  res.json({ message: 'Leave Management API is running!' });
});

app.get('/api/leaves/my-leaves', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.find({ userId: req.user.id })
      .populate('reviewedBy', 'name')
      .sort({ appliedDate: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all leaves (for managers/admins)
app.get('/api/leaves', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const leaves = await Leave.find()
      .populate('userId', 'name email department')
      .populate('reviewedBy', 'name')
      .sort({ appliedDate: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update leave status
app.patch('/api/leaves/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { status, comments } = req.body;
    
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    
    leave.status = status;
    leave.comments = comments;
    leave.reviewedBy = req.user.id;
    leave.reviewDate = new Date();
    
    await leave.save();
    
    // Update user leave balance if approved
    if (status === 'approved') {
      const user = await User.findById(leave.userId);
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      user.leaveBalance[leave.leaveType] -= days;
      await user.save();
    }
    
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});