import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const AdminRoute = () => {
  const { user, token } = useAuthStore();

  // Temporary fix since we don't store role in the UI state easily yet, 
  // but if role isn't stored, we could decode JWT. 
  // Wait, let's decode JWT to be sure or just assume if they try to access it we let the backend handle 401s,
  // but better to decode JWT token to check role.
  
  const getRole = () => {
    if (!token) return 'CUSTOMER';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (e) {
      return 'CUSTOMER';
    }
  };

  const role = getRole();

  if (!token || role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
