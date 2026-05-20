import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// @desc    Get user tasks
// @route   GET /api/tasks
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  return res.status(200).json([]);
});

export default router;
