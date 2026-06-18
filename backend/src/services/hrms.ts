import { Settings } from '../models/Settings';
import { FocusSession } from '../models/FocusSession';
import { randomUUID } from 'crypto';

export const syncSessionToHrms = async (
  userId: string,
  sessionId: string,
  projectId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const settings = await Settings.findOne({ userId });
    if (!settings || !settings.hrms?.apiKey || !settings.hrms?.workspaceId || !settings.hrms?.apiUrl) {
      return { success: false, message: 'HRMS API settings (URL / API Key / Workspace ID) not configured.' };
    }

    const session = await FocusSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return { success: false, message: 'Focus session not found.' };
    }

    if (session.syncedToHrms) {
      return { success: true, message: 'Session already synced to HRMS.' };
    }

    const { apiUrl, apiKey, workspaceId } = settings.hrms;
    const url = `${apiUrl}/workspaces/${workspaceId}/time-entries`;
    const description = `${session.category}: ${session.activityName}`;

    const body: any = {
      startedAt: new Date(session.startTime).toISOString(),
      endedAt: new Date(session.endTime).toISOString(),
      description,
      billable: true
    };

    if (projectId) {
      body.projectId = projectId;
    }

    const idempotencyKey = randomUUID();

    console.log(`Syncing session ${sessionId} to HRMS API at ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let resData: any = {};
    try {
      resData = JSON.parse(responseText);
    } catch (e) {
      // not JSON
    }

    if (response.ok || response.status === 200 || response.status === 201) {
      if (resData && resData.error) {
        return { success: false, message: `HRMS API returned error: ${resData.error.message}` };
      }

      session.syncedToHrms = true;
      const dataObj = resData.data;
      if (dataObj && (dataObj.id || dataObj._id)) {
        session.hrmsTimeEntryId = dataObj.id || dataObj._id;
      }
      await session.save();
      return { success: true, message: 'Successfully synced to HRMS.' };
    }

    console.error('HRMS sync error response:', responseText);
    const errorMsg = resData.error?.message || responseText || `HTTP ${response.status}`;
    return { success: false, message: `HRMS API returned: ${errorMsg}` };
  } catch (error: any) {
    console.error('HRMS sync catch error:', error);
    return { success: false, message: error.message || 'HRMS sync failed.' };
  }
};

export const fetchHrmsProjects = async (
  userId: string
): Promise<{ success: boolean; projects?: any[]; message?: string }> => {
  try {
    const settings = await Settings.findOne({ userId });
    if (!settings || !settings.hrms?.apiKey || !settings.hrms?.apiUrl) {
      return { success: false, message: 'HRMS API settings (URL / API Key) not configured.' };
    }

    const { apiUrl, apiKey } = settings.hrms;
    const url = `${apiUrl}/projects`;

    console.log(`Fetching HRMS projects from ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `HRMS projects request failed: ${response.status} ${errorText}` };
    }

    const resData = (await response.json()) as any;
    const projects = resData.data || [];
    const mappedProjects = Array.isArray(projects)
      ? projects.map((project: any) => ({ id: project.id, name: project.name }))
      : [];

    return { success: true, projects: mappedProjects };
  } catch (error: any) {
    console.error('HRMS fetch projects error:', error);
    return { success: false, message: error.message || 'Unable to fetch HRMS projects.' };
  }
};
