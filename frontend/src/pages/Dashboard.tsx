import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Clock, Award, Activity, Monitor, Circle, ListFilter, Play, Pause } from 'lucide-react';
import { API_BASE_URL, SOCKET_URL } from '../config';

interface FocusSessionType {
  _id: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  activityName: string;
  category: string;
  syncedToClockify: boolean;
}

interface SummaryStats {
  productiveHours: number;
  focusScore: number;
  categories: { name: string; value: number }[];
  topApps: { name: string; duration: number }[];
  sessions: FocusSessionType[];
  totalSeconds?: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SummaryStats>({
    productiveHours: 0.0,
    focusScore: 0,
    categories: [],
    topApps: [],
    sessions: [],
  });

  const [liveActivity, setLiveActivity] = useState<{
    appName: string;
    windowTitle: string;
    browserUrl?: string;
    isIdle: boolean;
    category: string;
    activeSession: FocusSessionType | null;
  } | null>(null);

  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchTodaySummary = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tracking/today-summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
        
        // If there's an active session in the summary, set base elapsed timer
        const latestSession = response.data.sessions[0];
        if (latestSession && new Date(latestSession.endTime).getTime() - new Date().getTime() < 30000) {
          setSecondsElapsed(latestSession.durationSeconds);
        }
      } catch (error) {
        console.error('Error fetching today summary:', error);
      }
    }
  };

  const fetchSettings = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrackingEnabled(response.data.trackingEnabled !== false);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    }
  };

  useEffect(() => {
    fetchTodaySummary();
    fetchSettings();
    
    // Connect to Websocket server
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected to backend');
      if (user) {
        socket.emit('join_user_channel', user._id);
      }
    });

    socket.on('live_tracking_ping', (data) => {
      setLiveActivity(data);
      
      // Update stats today summary periodically
      fetchTodaySummary();

      if (data.activeSession && !data.isIdle) {
        setSecondsElapsed(data.activeSession.durationSeconds);
      } else {
        setSecondsElapsed(0);
      }
    });

    return () => {
      if (socket) socket.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  // Keep a running ticker for live timer display
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (liveActivity && !liveActivity.isIdle && liveActivity.activeSession) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [liveActivity]);

  const toggleTracking = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const newStatus = !trackingEnabled;
        await axios.put(`${API_BASE_URL}/api/settings`, { trackingEnabled: newStatus }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrackingEnabled(newStatus);
        if (!newStatus) {
          setLiveActivity(null);
          setSecondsElapsed(0);
        }
      } catch (error) {
        console.error('Failed to toggle tracking:', error);
      }
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':');
  };

  const formatTimeSpent = (totalSecs: number | undefined, prodHrs: number) => {
    const secs = totalSecs !== undefined ? totalSecs : Math.round(prodHrs * 3600);
    if (secs < 60) return `${secs} secs`;
    if (secs < 3600) return `${Math.floor(secs / 60)} mins`;
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hrs`;
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Hello, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Let's stay productive. Here is your context summary for today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="premium-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Time Spent</span>
            <h3 className="text-2xl font-bold text-white">{formatTimeSpent(stats.totalSeconds, stats.productiveHours)}</h3>
            <p className="text-[10px] text-slate-500">Aggregated active time</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="premium-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Most Time Spent On</span>
            <h3 className="text-xl font-bold text-indigo-400 truncate max-w-[140px]" title={stats.topApps.length > 0 ? stats.topApps[0].name : 'N/A'}>
              {stats.topApps.length > 0 ? stats.topApps[0].name : 'N/A'}
            </h3>
            <p className="text-[10px] text-slate-500">Top application today</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="premium-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Sessions Merged</span>
            <h3 className="text-2xl font-bold text-white">{stats.sessions.length}</h3>
            <p className="text-[10px] text-slate-500">Continuous work blocks</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <ListFilter className="h-6 w-6" />
          </div>
        </div>

        <div className="premium-card p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">System Activity</span>
            <h3 className="text-2xl font-bold text-white">
              {!trackingEnabled ? 'Disabled' : (liveActivity ? (liveActivity.isIdle ? 'Idle' : 'Active') : 'Offline')}
            </h3>
            <p className="text-[10px] text-slate-500">Tracker connection status</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Live Tracking Status card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-8 rounded-3xl relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400">
                  <Circle className={`h-2 w-2 fill-current ${trackingEnabled && liveActivity && !liveActivity.isIdle ? 'text-emerald-400' : 'text-amber-500'}`} />
                  {!trackingEnabled ? 'Tracking Disabled' : (liveActivity ? (liveActivity.isIdle ? 'Idle State' : 'Live Tracking') : 'Tracker Offline')}
                </span>
                
                {!trackingEnabled ? (
                  <div>
                    <h2 className="text-2xl font-bold text-slate-300 tracking-tight">
                      Background tracking paused
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Tracking is disabled. Click the start button on the right to resume activity scanning.
                    </p>
                  </div>
                ) : (
                  liveActivity ? (
                    liveActivity.isIdle ? (
                      <div>
                        <h2 className="text-2xl font-bold text-amber-400 tracking-tight">
                          Away / Inactive
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          Tracking is paused. Activity resumes automatically when mouse/keyboard motion is detected.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                          {liveActivity.appName}
                        </h2>
                        <p className="text-sm font-semibold text-indigo-300 mt-1">
                          {liveActivity.category}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 font-mono truncate">
                          {liveActivity.windowTitle}
                        </p>
                        {liveActivity.browserUrl && (
                          <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                            {liveActivity.browserUrl}
                          </p>
                        )}
                      </div>
                    )
                  ) : (
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Tracker Offline
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        The background tracking service is not currently connected. Please ensure the tracker is running to capture your activity.
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center gap-6 justify-between md:justify-end">
                <div className="flex flex-col items-end gap-2">
                  <div className="font-mono text-4xl font-extrabold tracking-tight text-white">
                    {formatTimer(secondsElapsed)}
                  </div>
                  <button
                    onClick={toggleTracking}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
                      trackingEnabled 
                        ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-400' 
                        : 'bg-indigo-500 border-indigo-600 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    {trackingEnabled ? (
                      <>
                        <Pause className="h-3.5 w-3.5 fill-current" />
                        Stop Tracking
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Start Tracking
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline of work sessions */}
          <div className="premium-card p-6 rounded-2xl space-y-6">
            <h3 className="text-base font-bold text-white">Today's Focus sessions</h3>
            {stats.sessions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No sessions consolidated today. Get started by launching the tracker!
              </div>
            ) : (
              <div className="relative border-l border-white/[0.04] pl-4 ml-2 space-y-6">
                {stats.sessions.map((session) => (
                  <div key={session._id} className="relative space-y-2">
                    <span className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full bg-[#090a0f] border-2 border-indigo-500" />
                    
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-200">{session.activityName}</div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-500">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold">{session.category}</span>
                          <span>Duration: {Math.round(session.durationSeconds / 60)} mins</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {session.syncedToClockify ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                            Synced
                          </span>
                        ) : (
                          <span className="text-[10px] bg-yellow-500/10 text-yellow-300 font-bold px-2 py-0.5 rounded border border-yellow-500/20">
                            Not logged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Apps & Categories distributions */}
        <div className="space-y-6">
          {/* Top Applications */}
          <div className="premium-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Monitor className="h-4.5 w-4.5 text-indigo-400" />
              Top Used Applications
            </h3>
            {stats.topApps.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No application telemetry collected.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topApps.map((app) => (
                  <div key={app.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 truncate max-w-[150px]">{app.name}</span>
                      <span className="text-slate-500 font-mono">{app.duration}m</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${Math.min(100, (app.duration / Math.max(1, ...stats.topApps.map(a => a.duration))) * 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories usage */}
          <div className="premium-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-purple-400" />
              Category Allocations
            </h3>
            {stats.categories.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No category metrics resolved.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.categories.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{cat.name}</span>
                      <span className="text-slate-500 font-mono">{cat.value}m</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full" 
                        style={{ width: `${Math.min(100, (cat.value / Math.max(1, ...stats.categories.map(c => c.value))) * 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
