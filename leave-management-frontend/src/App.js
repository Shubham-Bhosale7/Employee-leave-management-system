import React, { useState, useEffect } from 'react';
import { Calendar, LogOut, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import './App.css'
import './index.css'
const API_URL = 'http://localhost:5000/api';

export default function LeaveManagementSystem() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leaves, setLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', password: '', role: 'employee', department: ''
  });
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'casual', startDate: '', endDate: '', reason: ''
  });
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUserData();
      fetchMyLeaves();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUser(data);
      if (data.role !== 'employee') {
        fetchAllLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/leaves/my-leaves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLeaves(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllLeaves = async () => {
    try {
      const res = await fetch(`${API_URL}/leaves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAllLeaves(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Login failed');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Registration failed');
    }
    setLoading(false);
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(leaveForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Leave applied successfully');
        setLeaveForm({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
        fetchMyLeaves();
        fetchUserData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to apply leave');
    }
    setLoading(false);
  };

  const handleUpdateLeave = async (leaveId, status, comments = '') => {
    try {
      const res = await fetch(`${API_URL}/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, comments })
      });
      if (res.ok) {
        alert(`Leave ${status} successfully`);
        fetchAllLeaves();
      }
    } catch (err) {
      alert('Failed to update leave');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLeaves([]);
    setAllLeaves([]);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-indigo-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800">Leave Manager</h1>
          </div>
          
          <div className="flex mb-6 border-b">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 ${isLogin ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 ${!isLogin ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
            >
              Register
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={registerData.department}
                  onChange={(e) => setRegisterData({...registerData, department: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={registerData.role}
                  onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Register'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-indigo-600 mr-2" />
              <span className="text-xl font-bold text-gray-800">Leave Manager</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-5 h-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 border-b-2 font-medium ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('apply')}
                className={`py-4 border-b-2 font-medium ${
                  activeTab === 'apply'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Apply Leave
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 border-b-2 font-medium ${
                  activeTab === 'history'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Leaves
              </button>
              {user?.role !== 'employee' && (
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`py-4 border-b-2 font-medium ${
                    activeTab === 'manage'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Manage Leaves
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Leave Balance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-blue-800 font-semibold mb-2">Casual Leave</h3>
                    <p className="text-3xl font-bold text-blue-600">{user?.leaveBalance?.casual || 0}</p>
                    <p className="text-sm text-blue-600 mt-1">days remaining</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-green-800 font-semibold mb-2">Sick Leave</h3>
                    <p className="text-3xl font-bold text-green-600">{user?.leaveBalance?.sick || 0}</p>
                    <p className="text-sm text-green-600 mt-1">days remaining</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-purple-800 font-semibold mb-2">Annual Leave</h3>
                    <p className="text-3xl font-bold text-purple-600">{user?.leaveBalance?.annual || 0}</p>
                    <p className="text-sm text-purple-600 mt-1">days remaining</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Leaves</h3>
                  {leaves.slice(0, 3).map((leave) => (
                    <div key={leave._id} className="flex justify-between items-center py-3 border-b">
                      <div>
                        <p className="font-medium text-gray-800">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">{leave.leaveType} leave</p>
                      </div>
                      {getStatusBadge(leave.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'apply' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Apply for Leave</h2>
                <form onSubmit={handleApplyLeave} className="max-w-2xl space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                    <select
                      value={leaveForm.leaveType}
                      onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="annual">Annual Leave</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={leaveForm.startDate}
                        onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={leaveForm.endDate}
                        onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      rows="4"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {loading ? 'Submitting...' : 'Apply Leave'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Leave History</h2>
                <div className="space-y-4">
                  {leaves.map((leave) => (
                    <div key={leave._id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800 capitalize">{leave.leaveType} Leave</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(leave.status)}
                      </div>
                      <p className="text-gray-700 mb-2">{leave.reason}</p>
                      {leave.comments && (
                        <div className="bg-gray-50 rounded p-3 mt-2">
                          <p className="text-sm font-medium text-gray-700">Manager's Comments:</p>
                          <p className="text-sm text-gray-600">{leave.comments}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Applied on {new Date(leave.appliedDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'manage' && user?.role !== 'employee' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Leave Requests</h2>
                <div className="space-y-4">
                  {allLeaves.filter(l => l.status === 'pending').map((leave) => (
                    <div key={leave._id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">{leave.userId?.name}</h3>
                          <p className="text-sm text-gray-600">{leave.userId?.email} • {leave.userId?.department}</p>
                        </div>
                        {getStatusBadge(leave.status)}
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 capitalize">{leave.leaveType} Leave</p>
                        <p className="text-sm text-gray-600">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-gray-700 mt-2">{leave.reason}</p>
                      <div className="flex space-x-3 mt-4">
                        <button
                          onClick={() => {
                            const comments = prompt('Enter comments (optional):');
                            handleUpdateLeave(leave._id, 'approved', comments || '');
                          }}
                          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const comments = prompt('Enter reason for rejection:');
                            if (comments) handleUpdateLeave(leave._id, 'rejected', comments);
                          }}
                          className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {allLeaves.filter(l => l.status === 'pending').length === 0 && (
                    <p className="text-gray-500 text-center py-8">No pending leave requests</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}