// Authentication utility functions

// Check if user is authenticated
const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
};

// Get current user
const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// Get auth token
const getToken = () => {
    return localStorage.getItem('token');
};

// Login user
const login = async (email, password) => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            return { success: true, data };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
};

// Signup user
const signup = async (userData) => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/signup', {
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
        console.error('Signup error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
};

// Logout user
const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// Redirect based on role
const redirectBasedOnRole = (role) => {
    switch(role) {
        case 'student':
            window.location.href = 'student-dashboard.html';
            break;
        case 'faculty':
            window.location.href = 'faculty-dashboard.html';
            break;
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        default:
            window.location.href = 'index.html';
    }
};

// Check authentication and redirect if not logged in
const requireAuth = (allowedRoles = []) => {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }

    const user = getCurrentUser();
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // User doesn't have required role, redirect to appropriate dashboard
        redirectBasedOnRole(user.role);
        return false;
    }

    return true;
};

// Make authenticated API request
const authenticatedFetch = async (url, options = {}) => {
    const token = getToken();
    
    if (!token) {
        throw new Error('No authentication token found');
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, fetchOptions);
        
        // If token is invalid or expired, logout
        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }
        
        return response;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};

// Format user display name
const formatUserName = (user) => {
    if (!user) return '';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length > 1) {
        return `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`;
    }
    return user.name;
};

// Get user role display name
const getRoleDisplayName = (role) => {
    const roles = {
        'student': 'Student',
        'faculty': 'Faculty Member',
        'admin': 'Administrator'
    };
    return roles[role] || role;
};

// Check if user has specific role
const hasRole = (role) => {
    const user = getCurrentUser();
    return user ? user.role === role : false;
};

// Check if user has any of the specified roles
const hasAnyRole = (roles) => {
    const user = getCurrentUser();
    return user ? roles.includes(user.role) : false;
};

// Update user profile (if needed)
const updateUserProfile = async (profileData) => {
    try {
        const response = await authenticatedFetch('http://localhost:5000/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (response.ok) {
            // Update stored user data
            const currentUser = getCurrentUser();
            const updatedUser = { ...currentUser, ...data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return { success: true, data: updatedUser };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, error: 'Failed to update profile' };
    }
};

// Change password
const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await authenticatedFetch('http://localhost:5000/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, message: data.message };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('Password change error:', error);
        return { success: false, error: 'Failed to change password' };
    }
};

// Request password reset
const requestPasswordReset = async (email) => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, message: data.message };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('Password reset request error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
};

// Reset password with token
const resetPassword = async (token, newPassword) => {
    try {
        const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, message: data.message };
        } else {
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
const isStrongPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Get password strength message
const getPasswordStrengthMessage = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password.length < 8) return 'Password strength: Weak (use at least 8 characters)';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strength === 4) return 'Password strength: Strong';
    if (strength === 3) return 'Password strength: Medium (add special characters for stronger password)';
    return 'Password strength: Weak (use uppercase, numbers, and special characters)';
};

// Auto-hide alerts after timeout
const setupAutoHideAlerts = () => {
    const alerts = document.querySelectorAll('.alert:not(.permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'opacity 0.5s';
            alert.style.opacity = '0';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 500);
        }, 5000);
    });
};

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // Setup auto-hide for alerts
    setupAutoHideAlerts();
    
    // Check if current page requires authentication
    const protectedPages = [
        'student-dashboard.html',
        'faculty-dashboard.html', 
        'admin-dashboard.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const user = getCurrentUser();
        
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        // Check role-specific page access
        if (currentPage === 'student-dashboard.html' && user.role !== 'student') {
            redirectBasedOnRole(user.role);
        } else if (currentPage === 'faculty-dashboard.html' && user.role !== 'faculty' && user.role !== 'admin') {
            redirectBasedOnRole(user.role);
        } else if (currentPage === 'admin-dashboard.html' && user.role !== 'admin') {
            redirectBasedOnRole(user.role);
        }
    }
    
    // Setup logout buttons
    const logoutBtns = document.querySelectorAll('#logout, .logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
    
    // Display user name in navigation if available
    const userNameElements = document.querySelectorAll('.user-name, #user-name');
    const user = getCurrentUser();
    if (user && userNameElements.length > 0) {
        userNameElements.forEach(el => {
            el.textContent = formatUserName(user);
        });
    }
});

// Export functions for use in other files
window.auth = {
    isAuthenticated,
    getCurrentUser,
    getToken,
    login,
    signup,
    logout,
    redirectBasedOnRole,
    requireAuth,
    authenticatedFetch,
    formatUserName,
    getRoleDisplayName,
    hasRole,
    hasAnyRole,
    updateUserProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    isValidEmail,
    isStrongPassword,
    getPasswordStrengthMessage
};