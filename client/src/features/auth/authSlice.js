import { createSlice } from '@reduxjs/toolkit';

// Helper function to get user from localStorage
const getUserFromStorage = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        return null;
    }
};

const initialState = {
    user: getUserFromStorage(), // Get user from localStorage on load
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            // Remove from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        // Add this to update user data if needed
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem('user', JSON.stringify(state.user));
        },
    },
});

export const { 
    setCredentials, 
    logout, 
    setLoading, 
    setError, 
    clearError,
    updateUser 
} = authSlice.actions;

export default authSlice.reducer;