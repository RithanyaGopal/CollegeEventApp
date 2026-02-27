const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/registrations
// @desc    Register for an event
// @access  Private/Student
router.post('/', protect, authorize('student'), async (req, res) => {
    try {
        const { eventId, fullName, email, studentId, department, year, semester, phoneNumber } = req.body;

        // Check if event exists and has space
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.currentParticipants >= event.maxParticipants) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Check if already registered
        const existingRegistration = await Registration.findOne({
            event: eventId,
            student: req.user._id
        });

        if (existingRegistration) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Create registration
        const registration = await Registration.create({
            event: eventId,
            student: req.user._id,
            fullName,
            email,
            studentId,
            department,
            year,
            semester,
            phoneNumber
        });

        // Update event participant count
        event.currentParticipants += 1;
        await event.save();

        res.status(201).json(registration);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/registrations/my-registrations
// @desc    Get student's registrations
// @access  Private/Student
router.get('/my-registrations', protect, authorize('student'), async (req, res) => {
    try {
        const registrations = await Registration.find({ student: req.user._id })
            .populate('event')
            .sort({ registrationDate: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/registrations/event/:eventId
// @desc    Get all registrations for an event
// @access  Private/Faculty & Admin
router.get('/event/:eventId', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('student', 'name email')
            .sort({ registrationDate: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/registrations/:id/status
// @desc    Update registration status
// @access  Private/Faculty & Admin
router.put('/:id/status', protect, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        registration.status = status;
        await registration.save();

        res.json(registration);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/registrations/:id
// @desc    Cancel registration
// @access  Private/Student
router.delete('/:id', protect, authorize('student'), async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Check if registration belongs to student
        if (registration.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update event participant count
        const event = await Event.findById(registration.event);
        if (event) {
            event.currentParticipants -= 1;
            await event.save();
        }

        await registration.deleteOne();
        res.json({ message: 'Registration cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;