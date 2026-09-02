import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { token, user } = useSelector((state) => state.auth);

    if (!token) {
        toast.error('Please login to access this page');
        return <Navigate to="/login" replace />;
    }

    // Check role-based access
    if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
        toast.error('You do not have permission to access this page');
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;