import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  allowedRoles?: ('ADMIN' | 'MECHANIC')[];
}

export default function PrivateRoute({ allowedRoles }: PrivateRouteProps) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir según el rol si intenta acceder a una ruta no permitida
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/mechanic" replace />;
    }
  }

  return <Outlet />;
}
