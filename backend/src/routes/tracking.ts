import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { RawActivity } from '../models/RawActivity';
import { FocusSession } from '../models/FocusSession';
import { Settings } from '../models/Settings';
import { classifyActivity } from '../services/classifier';
import { mergeActivityIntoSession } from '../services/sessionMerger';
import { syncSessionToClockify } from '../services/clockify';
import { io } from '../server';

const router = Router();

// @desc    Receive a tracking ping from Python agent
// @route   POST /api/tracking/ping
// @access  Private
router.post('/ping', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { appName, windowTitle, browserUrl, isIdle, timestamp } = req.body;

    if (!appName || !windowTitle) {
      return res.status(400).json({ message: 'App name and window title are required' });
    }

    const pingTime = timestamp ? new Date(timestamp) : new Date();

    // Check if tracking is disabled in settings
    const settings = await Settings.findOne({ userId: req.user._id });
    if (settings && !settings.trackingEnabled) {
      io.to(req.user._id.toString()).emit('live_tracking_ping', {
        appName: 'Tracking Paused',
        windowTitle: 'Tracking is disabled in Settings',
        isIdle: true,
        category: 'Other',
        timestamp: pingTime,
        activeSession: null,
      });

      return res.status(200).json({
        success: true,
        message: 'Tracking is paused in settings.',
        trackingEnabled: false,
      });
    }

    // 1. Classify the activity
    const category = classifyActivity(appName, windowTitle, browserUrl);

    // 2. Save raw tracking ping
    const rawActivity = await RawActivity.create({
      userId: req.user._id,
      timestamp: pingTime,
      appName,
      windowTitle,
      browserUrl,
      isIdle: !!isIdle,
      durationSeconds: 5, // 5s interval default
      category,
    });

    let activeSession = null;

    // 3. Merge raw activity into FocusSession if not idle
    if (!isIdle) {
      activeSession = await mergeActivityIntoSession(req.user._id.toString(), rawActivity);
    }

    // 4. Broadcast live tracking state via WebSockets
    io.to(req.user._id.toString()).emit('live_tracking_ping', {
      appName,
      windowTitle,
      browserUrl,
      isIdle,
      category,
      timestamp: pingTime,
      activeSession,
    });

    return res.status(200).json({
      success: true,
      category,
      activeSession,
    });
  } catch (error: any) {
    console.error('Tracking ping error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Get tracking statistics and sessions summary for today
// @route   GET /api/tracking/today-summary
// @access  Private
router.get('/today-summary', protect, async (req: AuthRequest, res: Response) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const userId = req.user._id;

    // Fetch sessions and activities
    const sessions = await FocusSession.find({
      userId,
      startTime: { $gte: startOfToday }
    }).sort({ startTime: -1 });

    const rawActivities = await RawActivity.find({
      userId,
      timestamp: { $gte: startOfToday }
    });

    let totalSeconds = 0;
    sessions.forEach((s: any) => {
      totalSeconds += s.durationSeconds;
    });

    // Category breakdown
    const categorySeconds: Record<string, number> = {};
    rawActivities.forEach(act => {
      if (!act.isIdle) {
        categorySeconds[act.category] = (categorySeconds[act.category] || 0) + act.durationSeconds;
      }
    });

    // App usage breakdown
    const appSeconds: Record<string, number> = {};
    rawActivities.forEach(act => {
      if (!act.isIdle) {
        appSeconds[act.appName] = (appSeconds[act.appName] || 0) + act.durationSeconds;
      }
    });

    const topApps = Object.entries(appSeconds)
      .map(([name, sec]) => ({ name, duration: Math.round(sec / 60) }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    const categories = Object.entries(categorySeconds).map(([name, sec]) => ({
      name,
      value: Math.round(sec / 60)
    }));

    return res.status(200).json({
      productiveHours: Number((totalSeconds / 3600).toFixed(1)),
      focusScore: totalSeconds > 0 ? Math.min(100, Math.round((totalSeconds / (8 * 3600)) * 100)) : 0,
      categories,
      topApps,
      sessions
    });
  } catch (error: any) {
    console.error('Summary error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Manually sync a Focus Session to Clockify
// @route   POST /api/tracking/sync-clockify/:sessionId
// @access  Private
router.post('/sync-clockify/:sessionId', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await syncSessionToClockify(req.user._id.toString(), sessionId);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('Manual sync error:', error);
    return res.status(500).json({ message: error.message });
  }
});

export default router;
