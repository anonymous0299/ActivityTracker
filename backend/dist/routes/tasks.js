"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// @desc    Get user tasks
// @route   GET /api/tasks
// @access  Private
router.get('/', auth_1.protect, async (req, res) => {
    return res.status(200).json([]);
});
exports.default = router;
