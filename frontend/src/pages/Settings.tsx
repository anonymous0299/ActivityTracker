import { useState, useEffect } from 'react';
import axios from 'axios';
import { Key, Sliders, ToggleLeft, ToggleRight, Save, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Settings = () => {
  const [settings, setSettings] = useState({
    trackingEnabled: true,
    idleTimeoutMinutes: 5,
    mergeThresholdMinutes: 2,
    clockify: {
      apiKey: '',
      workspaceId: '',
      autoSync: false,
    },
    hrms: {
      apiUrl: 'https://hrms-web-prod.onrender.com/time/timer',
      apiKey: '',
      autoSync: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/settings`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const { trackingEnabled, idleTimeoutMinutes, mergeThresholdMinutes, clockify, hrms } = response.data;
          setSettings({
            trackingEnabled: trackingEnabled !== undefined ? trackingEnabled : true,
            idleTimeoutMinutes: idleTimeoutMinutes || 5,
            mergeThresholdMinutes: mergeThresholdMinutes || 2,
            clockify: {
              apiKey: clockify?.apiKey || '',
              workspaceId: clockify?.workspaceId || '',
              autoSync: !!clockify?.autoSync,
            },
            hrms: {
              apiUrl: hrms?.apiUrl || 'https://hrms-web-prod.onrender.com/time/timer',
              apiKey: hrms?.apiKey || '',
              autoSync: !!hrms?.autoSync,
            },
          });
        } catch (error) {
          console.error('Error fetching settings:', error);
        }
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.put(`${API_BASE_URL}/api/settings`, settings, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400">
        Loading settings profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Configurations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Adjust background tracking thresholds and integrate Clockify automation.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-semibold transition-all">
          <CheckCircle className="h-5 w-5" />
          Settings successfully saved and synchronized.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Tracking Settings */}
        <div className="premium-card p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-indigo-400" />
            Tracking Configurations
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Idle Trigger Threshold (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.idleTimeoutMinutes}
                  onChange={e => setSettings(prev => ({ ...prev, idleTimeoutMinutes: parseInt(e.target.value) || 5 }))}
                  className="premium-input w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Merge Consolidation Threshold (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.mergeThresholdMinutes}
                  onChange={e => setSettings(prev => ({ ...prev, mergeThresholdMinutes: parseInt(e.target.value) || 2 }))}
                  className="premium-input w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clockify Integration */}
        <div className="premium-card p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="h-4.5 w-4.5 text-purple-400" />
            Clockify Automation API
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Clockify Personal API Token</label>
              <input
                type="password"
                placeholder="Enter Clockify API Key..."
                value={settings.clockify.apiKey}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  clockify: { ...prev.clockify, apiKey: e.target.value }
                }))}
                className="premium-input w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Target Workspace ID</label>
              <input
                type="text"
                placeholder="Enter Clockify Workspace ID..."
                value={settings.clockify.workspaceId}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  clockify: { ...prev.clockify, workspaceId: e.target.value }
                }))}
                className="premium-input w-full"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <label className="text-sm font-semibold text-slate-200">Automatic Focus Syncing</label>
                <p className="text-xs text-slate-400">Instantly push finished focus blocks to Clockify</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  clockify: { ...prev.clockify, autoSync: !prev.clockify.autoSync }
                }))}
                className="text-slate-300 hover:text-white transition-colors"
              >
                {settings.clockify.autoSync ? (
                  <ToggleRight className="h-10 w-10 text-purple-400" />
                ) : (
                  <ToggleLeft className="h-10 w-10 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* HRMS Time Tracker Integration */}
        <div className="premium-card p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="h-4.5 w-4.5 text-indigo-400" />
            HRMS Time Tracker API
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">HRMS Endpoint URL</label>
              <input
                type="text"
                placeholder="Enter HRMS endpoint URL..."
                value={settings.hrms.apiUrl}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  hrms: { ...prev.hrms, apiUrl: e.target.value }
                }))}
                className="premium-input w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">HRMS Authorization Token</label>
              <input
                type="password"
                placeholder="Enter HRMS API Token (if required)..."
                value={settings.hrms.apiKey}
                onChange={e => setSettings(prev => ({
                  ...prev,
                  hrms: { ...prev.hrms, apiKey: e.target.value }
                }))}
                className="premium-input w-full"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <label className="text-sm font-semibold text-slate-200">Automatic HRMS Syncing</label>
                <p className="text-xs text-slate-400">Instantly push finished focus blocks to your HRMS</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  hrms: { ...prev.hrms, autoSync: !prev.hrms.autoSync }
                }))}
                className="text-slate-300 hover:text-white transition-colors"
              >
                {settings.hrms.autoSync ? (
                  <ToggleRight className="h-10 w-10 text-indigo-400" />
                ) : (
                  <ToggleLeft className="h-10 w-10 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Save className="h-4.5 w-4.5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Settings;
