const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Hardcoded connection string - no env file needed
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017/college_event_management');
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;