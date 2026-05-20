import { FocusSession } from '../models/FocusSession';
import { RawActivity } from '../models/RawActivity';
import { Settings } from '../models/Settings';
import { syncSessionToClockify } from './clockify';

export const mergeActivityIntoSession = async (
  userId: string,
  rawActivity: any
): Promise<any> => {
  // Get user settings for threshold configuration
  const settings = await Settings.findOne({ userId });
  const mergeThresholdMinutes = settings?.mergeThresholdMinutes || 2;
  const mergeThresholdSeconds = mergeThresholdMinutes * 60;

  const now = new Date(rawActivity.timestamp);

  // Find the last active FocusSession for this user
  let activeSession = await FocusSession.findOne({ userId }).sort({ startTime: -1 });

  // If there's no session at all
  if (!activeSession) {
    activeSession = await FocusSession.create({
      userId,
      startTime: now,
      endTime: now,
      durationSeconds: rawActivity.durationSeconds,
      activityName: rawActivity.windowTitle || rawActivity.appName,
      category: rawActivity.category,
      syncedToClockify: false,
    });
    return activeSession;
  }

  // Calculate gap between last ping time of session and current ping
  const sessionLastPingTime = new Date(activeSession.endTime);
  const gapSeconds = Math.round((now.getTime() - sessionLastPingTime.getTime()) / 1000);

  // If the user was away / idle for a while (gap is larger than, say, 30 seconds)
  // we close the active session and start a new one
  if (gapSeconds > 30) {
    // Auto-sync closed session to Clockify
    if (settings?.clockify?.autoSync) {
      syncSessionToClockify(userId, activeSession._id.toString()).catch((err) =>
        console.error('Auto-sync to Clockify error (gap):', err)
      );
    }

    activeSession = await FocusSession.create({
      userId,
      startTime: now,
      endTime: now,
      durationSeconds: rawActivity.durationSeconds,
      activityName: rawActivity.windowTitle || rawActivity.appName,
      category: rawActivity.category,
      syncedToClockify: false,
    });
    return activeSession;
  }

  // The ping is contiguous.
  // If the category is the same, we simply extend the active session
  if (activeSession.category === rawActivity.category) {
    activeSession.endTime = now;
    activeSession.durationSeconds += rawActivity.durationSeconds;
    activeSession.activityName = rawActivity.windowTitle || rawActivity.appName;
    await activeSession.save();
    return activeSession;
  }

  // The category is different. We have a workflow switch!
  // To implement the "ignore accidental tiny switches" rule:
  // We check the raw logs of the user for the last N seconds (equal to mergeThresholdSeconds)
  // to see if they've consistently switched to this new category.
  const thresholdStart = new Date(now.getTime() - (mergeThresholdSeconds * 1000));
  const recentActivities = await RawActivity.find({
    userId,
    timestamp: { $gte: thresholdStart }
  }).sort({ timestamp: 1 });

  // Count how many pings in this window are of the new category versus the old category
  const newCategoryCount = recentActivities.filter(act => act.category === rawActivity.category).length;
  const oldCategoryCount = recentActivities.filter(act => act.category === activeSession!.category).length;

  // If the new category is dominant (e.g. user spent more time in the new category than the old one in this window)
  // we split the session: close the old one and start a new one
  if (newCategoryCount > oldCategoryCount) {
    // Auto-sync closed session to Clockify
    if (settings?.clockify?.autoSync) {
      syncSessionToClockify(userId, activeSession._id.toString()).catch((err) =>
        console.error('Auto-sync to Clockify error (split):', err)
      );
    }

    activeSession = await FocusSession.create({
      userId,
      startTime: now,
      endTime: now,
      durationSeconds: rawActivity.durationSeconds,
      activityName: rawActivity.windowTitle || rawActivity.appName,
      category: rawActivity.category,
      syncedToClockify: false,
    });
  } else {
    // It's a temporary switch. We extend the current session but keep its original category!
    // This merges the temporary switch into the active workflow.
    activeSession!.endTime = now;
    activeSession!.durationSeconds += rawActivity.durationSeconds;
    await activeSession!.save();
  }

  return activeSession;
};
