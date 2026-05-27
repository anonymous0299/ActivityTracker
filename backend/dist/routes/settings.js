"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Settings_1 = require("../models/Settings");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// @desc    Get current user settings
// @route   GET /api/settings
// @access  Private
router.get('/', auth_1.protect, async (req, res) => {
    try {
        let settings = await Settings_1.Settings.findOne({ userId: req.user._id });
        if (!settings) {
            settings = await Settings_1.Settings.create({
                userId: req.user._id,
                theme: 'dark',
                trackingEnabled: true,
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
        }
        return res.status(200).json(settings);
    }
    catch (error) {
        console.error('Fetch settings error:', error);
        return res.status(500).json({ message: error.message });
    }
});
// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
router.put('/', auth_1.protect, async (req, res) => {
    try {
        let settings = await Settings_1.Settings.findOne({ userId: req.user._id });
        if (!settings) {
            settings = new Settings_1.Settings({ userId: req.user._id });
        }
        const { theme, trackingEnabled, idleTimeoutMinutes, mergeThresholdMinutes, clockify, privacy } = req.body;
        if (theme !== undefined)
            settings.theme = theme;
        if (trackingEnabled !== undefined)
            settings.trackingEnabled = trackingEnabled;
        if (idleTimeoutMinutes !== undefined)
            settings.idleTimeoutMinutes = idleTimeoutMinutes;
        if (mergeThresholdMinutes !== undefined)
            settings.mergeThresholdMinutes = mergeThresholdMinutes;
        if (clockify !== undefined) {
            settings.clockify = {
                ...settings.clockify,
                ...clockify,
            };
        }
        if (privacy !== undefined) {
            settings.privacy = {
                ...settings.privacy,
                ...privacy,
            };
        }
        await settings.save();
        return res.status(200).json(settings);
    }
    catch (error) {
        console.error('Update settings error:', error);
        return res.status(500).json({ message: error.message });
    }
});
exports.default = router;
