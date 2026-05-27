import { useEffect, useState } from 'react';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

interface AnalyticsData {
  hourlyData: { hour: string; duration: number }[];
  categories: { name: string; value: number }[];
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/tracking/today-summary`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setData(res.data);
        } catch (error) {
          console.error(error);
        }
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Productivity Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Detailed metrics, application usage graphs, and machine-learning intelligence suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Trend Line Chart */}
        <div className="lg:col-span-2 premium-card p-6 rounded-2xl space-y-4 shadow-xl shadow-indigo-900/5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
              Focus & Productivity Trend (Minutes per Hour)
            </h2>
          </div>
          <div className="h-[300px] w-full mt-4">
            {data?.hourlyData && data.hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#ffffff10', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                    itemStyle={{ color: '#c7d2fe', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Line type="monotone" dataKey="duration" name="Minutes Active" stroke="#6366f1" strokeWidth={4} dot={{ fill: '#090a0f', stroke: '#8b5cf6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Awaiting background tracking data to generate charts.
              </div>
            )}
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="premium-card p-6 rounded-2xl space-y-4 shadow-xl shadow-purple-900/5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PieIcon className="h-4.5 w-4.5 text-purple-400" />
            Time Allocation
          </h2>
          <div className="h-[300px] w-full mt-4 flex flex-col items-center">
            {data?.categories && data.categories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.categories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0f111a', borderColor: '#ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {data.categories.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      {cat.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                No distributions loaded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
