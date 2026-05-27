"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const settings_1 = __importDefault(require("./routes/settings"));
const tracking_1 = __importDefault(require("./routes/tracking"));
const tasks_1 = __importDefault(require("./routes/tasks"));
// Load environment variables
dotenv_1.default.config();
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('JWT_SECRET must be defined in production. Exiting.');
    process.exit(1);
}
// Connect to MongoDB
(0, db_1.default)();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Setup Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});
exports.io = io;
// Middlewares
app.set('trust proxy', 1);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes configuration
app.use('/api/auth', auth_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/tracking', tracking_1.default);
app.use('/api/tasks', tasks_1.default);
// Health check endpoint
app.get('/', (req, res) => {
    res.send('WorkTrack AI backend engine is operating successfully.');
});
// Socket.io Connection Handler
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    // User joins a personal tracking channel
    socket.on('join_user_channel', (userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined channel of user: ${userId}`);
    });
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});
