"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = require("mongoose");
const TaskSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    category: { type: String, required: true, default: 'General' },
    dueDate: { type: Date },
    aiSuggested: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
exports.Task = (0, mongoose_1.model)('Task', TaskSchema);
