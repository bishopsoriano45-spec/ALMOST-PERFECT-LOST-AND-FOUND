import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AdminDashboard from './AdminDashboard';
import axios from 'axios';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      // Setup axios interceptor for admin requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/admin/login', {
        username,
        password
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        // Set default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setIsAuthenticated(true);
        toast.success('Admin login successful');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    toast.info('Logged out');
  };

  if (isAuthenticated) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-none bg-slate-900 text-white p-2 text-center text-sm flex justify-between items-center px-4 sm:px-8 z-50">
          <span className="flex items-center gap-2 text-xs sm:text-sm"><Shield className="w-3 h-3" /><span className="hidden sm:inline">Admin Mode Active</span><span className="sm:hidden">Admin</span></span>
          <button onClick={handleLogout} className="text-xs hover:underline text-red-300">Logout</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <AdminDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>
            Enter your credentials to access the administrative dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Username"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-3 text-sm flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Restricted area. All activities are monitored and logged.</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Authenticating...' : 'Secure Login'}
            </Button>

            <div className="text-center text-xs text-gray-500 mt-4">
              <a href="/" className="hover:underline">Return to Home</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}