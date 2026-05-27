"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchClockifyProjects = exports.syncSessionToClockify = void 0;
const Settings_1 = require("../models/Settings");
const FocusSession_1 = require("../models/FocusSession");
const syncSessionToClockify = async (userId, sessionId, projectId) => {
    try {
        const settings = await Settings_1.Settings.findOne({ userId });
        if (!settings || !settings.clockify?.apiKey || !settings.clockify?.workspaceId) {
            return { success: false, message: 'Clockify credentials (API Key/Workspace ID) not configured.' };
        }
        const session = await FocusSession_1.FocusSession.findOne({ _id: sessionId, userId });
        if (!session) {
            return { success: false, message: 'Focus session not found.' };
        }
        if (session.syncedToClockify) {
            return { success: true, message: 'Session already synced.' };
        }
        const { apiKey, workspaceId } = settings.clockify;
        const url = `https://api.clockify.me/api/v1/workspaces/${workspaceId}/time-entries`;
        const description = `${session.category}: ${session.activityName}`;
        const body = {
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
    }
    catch (error) {
        console.error('Clockify sync catch error:', error);
        return { success: false, message: error.message || 'Clockify sync failed.' };
    }
};
exports.syncSessionToClockify = syncSessionToClockify;
const fetchClockifyProjects = async (userId) => {
    try {
        const settings = await Settings_1.Settings.findOne({ userId });
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
            ? projects.map((project) => ({ id: project.id, name: project.name }))
            : [];
        return { success: true, projects: mappedProjects };
    }
    catch (error) {
        console.error('Clockify fetch projects error:', error);
        return { success: false, message: error.message || 'Unable to fetch Clockify projects.' };
    }
};
exports.fetchClockifyProjects = fetchClockifyProjects;
