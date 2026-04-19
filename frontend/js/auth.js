const API_URL = "http://localhost:5000";

// Authentication utility functions

const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
};

const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

const getToken = () => {
    return localStorage.getItem('token');
};

// Login user
const login = async (email, password) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            return { success: true, data };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        return { success: false, error: 'Network error. Please try again.' };
    }
};

// Signup user
const signup = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        return { success: false, error: 'Network error. Please try again.' };
    }
};

// Logout
const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// Authenticated Fetch
const authenticatedFetch = async (url, options = {}) => {
    const token = getToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    if (response.status === 401) {
        logout();
    }

    return response;
};

// Update Profile
const updateUserProfile = async (profileData) => {
    const response = await authenticatedFetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData)
    });

    return await response.json();
};

// Change Password
const changePassword = async (currentPassword, newPassword) => {
    const response = await authenticatedFetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
    });

    return await response.json();
};

// Forgot Password
const requestPasswordReset = async (email) => {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    return await response.json();
};

// Reset Password
const resetPassword = async (token, newPassword) => {
    const response = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
    });

    return await response.json();
};

// Export
window.auth = {
    isAuthenticated,
    getCurrentUser,
    getToken,
    login,
    signup,
    logout,
    authenticatedFetch,
    updateUserProfile,
    changePassword,
    requestPasswordReset,
    resetPassword
};