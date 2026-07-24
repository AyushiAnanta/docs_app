import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Authentication from './Authentication/Authentication'
import Dashboard from './Dashboard/Dashboard.jsx'
import MainDoc from "./Document/MainDoc.jsx"
import SharedDoc from "./Document/SharedDoc.jsx"

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/v1/user/current-user');
        if (res.data.success || res.data.statusCode === 200) {
          setUser(res.data.data);
        }
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-800 text-white">
        <div className="text-xl">Loading docs...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/dashboard" replace /> : <Authentication onLoginSuccess={(u) => setUser(u)} />} 
      />
      <Route 
        path="/dashboard" 
        element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/document/:id" 
        element={user ? <MainDoc user={user} /> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/shared/:id" 
        element={<SharedDoc />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} 
      />
    </Routes>
  );
}

export default App