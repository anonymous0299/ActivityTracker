import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, ArrowLeft, RotateCw, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface FocusSessionType {
  _id: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  activityName: string;
  category: string;
  syncedToClockify: boolean;
}

interface ClockifyProject {
  id: string;
  name: string;
}

const Logs = () => {
  const [sessions, setSessions] = useState<FocusSessionType[]>([]);
  const [projects, setProjects] = useState<ClockifyProject[]>([]);
  const [selectedSession, setSelectedSession] = useState<FocusSessionType | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [skippingId, setSkippingId] = useState<string | null>(null);
  const [loggingAll, setLoggingAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const fetchSessions = async () => {
    if (!authHeaders) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tracking/unsynced-sessions`, {
        headers: authHeaders,
      });
      setSessions(response.data.sessions || []);
      if (!selectedSession && response.data.sessions.length > 0) {
        setSelectedSession(response.data.sessions[0]);
      }
    } catch (error) {
      console.error('Failed to fetch unsynced sessions:', error);
    }
  };

  const fetchProjects = async () => {
    if (!authHeaders) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tracking/clockify-projects`, {
        headers: authHeaders,
      });
      setProjects(response.data.projects || []);
      if (!selectedProjectId && response.data.projects?.length > 0) {
        setSelectedProjectId(response.data.projects[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch Clockify projects:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleSelectSession = (session: FocusSessionType) => {
    setSelectedSession(session);
    setMessage(null);
  };

  const handleSkipSession = async (sessionId: string) => {
    if (!authHeaders) return;
    setSkippingId(sessionId);
    try {
      await axios.put(`${API_BASE_URL}/api/tracking/skip-session/${sessionId}`, {}, {
        headers: authHeaders,
      });
      setSessions((prev) => prev.filter((session) => session._id !== sessionId));
      if (selectedSession?._id === sessionId) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Failed to skip session:', error);
    }
    setSkippingId(null);
  };

  const handleLogSession = async (session: FocusSessionType) => {
    if (!authHeaders) return;
    setSavingId(session._id);
    setMessage(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tracking/sync-clockify/${session._id}`,
        { projectId: selectedProjectId || undefined },
        { headers: authHeaders }
      );
      if (response.data.success) {
        setMessage('Session logged successfully.');
        fetchSessions();
        if (selectedSession?._id === session._id) {
          setSelectedSession(null);
        }
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to log session. Please ensure Clockify settings are configured.');
    }
    setSavingId(null);
  };

  const handleLogAll = async () => {
    if (!authHeaders) return;
    setLoggingAll(true);
    setMessage(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/tracking/sync-clockify-all`,
        { projectId: selectedProjectId || undefined },
        { headers: authHeaders }
      );
      if (response.data.success) {
        setMessage(`${response.data.synced}/${response.data.total} session(s) logged successfully.`);
        setSessions([]);
        setSelectedSession(null);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to log all sessions.');
    }
    setLoggingAll(false);
  };

  const renderSessionDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Logs</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review sessions that were not logged to Clockify and sync them manually.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleLogAll}
            disabled={sessions.length === 0 || loggingAll}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {loggingAll ? <RotateCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Log all sessions
          </button>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            {sessions.length} session(s) pending
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <div className="premium-card p-6 rounded-3xl border border-white/5 bg-slate-950/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Pending activities</h2>
              <p className="text-xs text-slate-500">Choose a log item to preview details.</p>
            </div>
            <ClipboardList className="h-5 w-5 text-indigo-400" />
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-slate-500">
              No unsynced sessions available. Clockify sync is up to date.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <button
                  key={session._id}
                  type="button"
                  onClick={() => handleSelectSession(session)}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${selectedSession?._id === session._id ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white truncate">{session.activityName}</div>
                    <span className="rounded-full bg-slate-800/90 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400">
                      {renderSessionDuration(session.durationSeconds)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{session.category}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>→</span>
                    <span>{new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="premium-card p-6 rounded-3xl border border-white/5 bg-slate-950/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Session preview</h2>
              <p className="text-xs text-slate-500">Edit the log and select a Clockify project before syncing.</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSession(null)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:border-indigo-500/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>

          {selectedSession ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Activity</div>
                    <h3 className="mt-2 text-xl font-bold text-white">{selectedSession.activityName}</h3>
                  </div>
                  <div className="rounded-2xl bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                    {selectedSession.category}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Start</div>
                    <div className="mt-2 font-semibold">{new Date(selectedSession.startTime).toLocaleString()}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">End</div>
                    <div className="mt-2 font-semibold">{new Date(selectedSession.endTime).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Clockify Project</label>
                {projects.length > 0 ? (
                  <select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0d111a] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-2xl bg-slate-950/80 p-4 text-sm text-slate-400">
                    No Clockify projects found. Please configure your Clockify API token and workspace ID in Settings.
                  </div>
                )}
              </div>

              {message ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="text-slate-500">Status:</span>
                  <span className="rounded-full bg-yellow-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-yellow-300">
                    Waiting to log
                  </span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleSkipSession(selectedSession._id)}
                    disabled={skippingId === selectedSession._id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-red-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {skippingId === selectedSession._id ? <RotateCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogSession(selectedSession)}
                    disabled={!projects.length || savingId === selectedSession._id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    {savingId === selectedSession._id ? <RotateCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Log session
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-slate-500">
              Select a pending session to view details and assign a Clockify project.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
