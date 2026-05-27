"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Settings_1 = require("../models/Settings");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretactivationkey12345';
// Generate JWT token
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, JWT_SECRET, {
        expiresIn: '30d',
    });
};
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }
        // Check if user exists
        const userExists = await User_1.User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Create user
        const user = await User_1.User.create({
            name,
            email,
            passwordHash: password, // Pre-save hook hashes password
        });
        if (user) {
            // Create default settings for user
            await Settings_1.Settings.create({
                userId: user._id,
                theme: 'dark',
                idleTimeoutMinutes: 5,
                mergeThresholdMinutes: 2,
                clockify: {
                    apiKey: '',
                    workspaceId: '',
                    projectIdMap: new Map(),
                    autoSync: false,
                },
                privacy: {
                    ignoreUrls: [],
                    ignoreAppNames: [],
                },
            });
            return res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id),
            });
        }
        else {
            return res.status(400).json({ message: 'Invalid user data' });
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: error.message });
    }
});
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter email and password' });
        }
        const user = await User_1.User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            return res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id),
            });
        }
        else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: error.message });
    }
});
// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get('/me', auth_1.protect, async (req, res) => {
    try {
        return res.status(200).json(req.user);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.default = router;
