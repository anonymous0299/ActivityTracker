import { Settings } from '../models/Settings';
import { FocusSession } from '../models/FocusSession';

interface ClockifyProject {
  id: string;
  name: string;
}

export const syncSessionToClockify = async (
  userId: string,
  sessionId: string,
  projectId?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const settings = await Settings.findOne({ userId });
    if (!settings || !settings.clockify?.apiKey || !settings.clockify?.workspaceId) {
      return { success: false, message: 'Clockify credentials (API Key/Workspace ID) not configured.' };
    }

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

    const body: any = {
      start: new Date(session.startTime).toISOString(),
      end: new Date(session.endTime).toISOString(),
      description,
    };

    if (projectId) {
      body.projectId = projectId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status === 201) {
      session.syncedToClockify = true;
      await session.save();
      return { success: true, message: 'Successfully synced to Clockify.' };
    }

    const errorText = await response.text();
    console.error('Clockify sync error response:', errorText);
    return { success: false, message: `Clockify API returned status ${response.status}: ${errorText}` };
  } catch (error: any) {
    console.error('Clockify sync catch error:', error);
    return { success: false, message: error.message || 'Clockify sync failed.' };
  }
};

export const fetchClockifyProjects = async (
  userId: string
): Promise<{ success: boolean; projects?: ClockifyProject[]; message?: string }> => {
  try {
    const settings = await Settings.findOne({ userId });
    if (!settings || !settings.clockify?.apiKey || !settings.clockify?.workspaceId) {
      return { success: false, message: 'Clockify credentials (API Key/Workspace ID) not configured.' };
    }

    const { apiKey, workspaceId } = settings.clockify;
    const url = `https://api.clockify.me/api/v1/workspaces/${workspaceId}/projects`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `Clockify projects request failed: ${response.status} ${errorText}` };
    }

    const projects = await response.json();
    const mappedProjects = Array.isArray(projects)
      ? projects.map((project: any) => ({ id: project.id, name: project.name }))
      : [];

    return { success: true, projects: mappedProjects };
  } catch (error: any) {
    console.error('Clockify fetch projects error:', error);
    return { success: false, message: error.message || 'Unable to fetch Clockify projects.' };
  }
};
