import { Settings } from '../models/Settings';
import { FocusSession } from '../models/FocusSession';

export const syncSessionToClockify = async (
  userId: string,
  sessionId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Fetch user settings
    const settings = await Settings.findOne({ userId });
    if (!settings || !settings.clockify?.apiKey || !settings.clockify?.workspaceId) {
      return { success: false, message: 'Clockify credentials (API Key/Workspace ID) not configured.' };
    }

    // 2. Fetch focus session
    const session = await FocusSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return { success: false, message: 'Focus session not found.' };
    }

    if (session.syncedToClockify) {
      return { success: true, message: 'Session already synced.' };
    }

    const { apiKey, workspaceId } = settings.clockify;
    const url = `https://api.clockify.me/api/v1/workspaces/${workspaceId}/time-entries`;

    const description = `${session.category}: ${session.activityName}`;

    // 3. Post to Clockify API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: new Date(session.startTime).toISOString(),
        end: new Date(session.endTime).toISOString(),
        description,
      }),
    });

    if (response.status === 201) {
      session.syncedToClockify = true;
      await session.save();
      return { success: true, message: 'Successfully synced to Clockify.' };
    } else {
      const errorText = await response.text();
      console.error('Clockify sync error response:', errorText);
      return { success: false, message: `Clockify API returned status ${response.status}: ${errorText}` };
    }
  } catch (error: any) {
    console.error('Clockify sync catch error:', error);
    return { success: false, message: error.message || 'Clockify sync failed.' };
  }
};
