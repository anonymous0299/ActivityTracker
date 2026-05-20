import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';

// Import routes
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
import trackingRoutes from './routes/tracking';
import tasksRoutes from './routes/tasks';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes configuration
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/tasks', tasksRoutes);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('WorkTrack AI backend engine is operating successfully.');
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // User joins a personal tracking channel
  socket.on('join_user_channel', (userId: string) => {
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

// Export Socket IO instance to use in services/controllers later
export { io };
