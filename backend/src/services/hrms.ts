import { Settings } from '../models/Settings';
import { FocusSession } from '../models/FocusSession';

export const syncSessionToHrms = async (
  userId: string,
  sessionId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const settings = await Settings.findOne({ userId });
    if (!settings || !settings.hrms?.apiUrl) {
      return { success: false, message: 'HRMS API URL not configured.' };
    }

    const session = await FocusSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return { success: false, message: 'Focus session not found.' };
    }

    if (session.syncedToHrms) {
      return { success: true, message: 'Session already synced to HRMS.' };
    }

    const { apiUrl, apiKey } = settings.hrms;
    const description = `${session.category}: ${session.activityName}`;

    const body = {
      startTime: new Date(session.startTime).toISOString(),
      endTime: new Date(session.endTime).toISOString(),
      durationSeconds: session.durationSeconds,
      description,
      category: session.category,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    console.log(`Syncing session ${sessionId} to HRMS API at ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok || response.status === 200 || response.status === 201) {
      session.syncedToHrms = true;
      try {
        const responseData = (await response.json()) as any;
        if (responseData && (responseData.id || responseData._id)) {
          session.hrmsTimeEntryId = responseData.id || responseData._id;
        }
      } catch (e) {
        // Response might not be JSON, skip reading ID
      }
      await session.save();
      return { success: true, message: 'Successfully synced to HRMS.' };
    }

    const errorText = await response.text();
    console.error('HRMS sync error response:', errorText);
    return { success: false, message: `HRMS API returned status ${response.status}: ${errorText}` };
  } catch (error: any) {
    console.error('HRMS sync catch error:', error);
    return { success: false, message: error.message || 'HRMS sync failed.' };
  }
};
