const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const JWT_SECRET = 'your_super_secret_jwt_key_here';
const JWT_EXPIRE = '7d';

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};

// Signup route
router.post('/signup', async (req, res) => {
    try {
        console.log('Signup request:', req.body);
        
        const { name, email, password, role, studentId, facultyId, adminId } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                message: 'Name, email, password and role are required' 
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user object based on role
        const userData = {
            name,
            email,
            password,
            role
        };

        // Add role-specific ID
        if (role === 'student') {
            userData.studentId = studentId || null;
        } else if (role === 'faculty') {
            userData.facultyId = facultyId || null;
        } else if (role === 'admin') {
            userData.adminId = adminId || null;
        }

        // Create user
        const user = await User.create(userData);
        console.log('User created successfully:', user._id);

        const token = generateToken(user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Duplicate field value. Please use different values.' 
            });
        }
        
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    res.json(req.user);
});

module.exports = router;