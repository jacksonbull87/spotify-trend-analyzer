import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Calendar, Music, BarChart3, ChevronRight, Loader2, AlertCircle, Database } from 'lucide-react';

const COLORS = ['#1DB954', '#8E44AD', '#3498DB', '#E67E22', '#E74C3C', '#F1C40F'];
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const App = () => {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [songs, setSongs] = useState([]);
  const [themes, setThemes] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({ source: 'Checking...', keys: [] });

  const [allStaticData, setAllStaticData] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      let weeksData = [];
      let trendsData = [];
      let sourceName = '';
      
      try {
        const weeksRes = await axios.get(`${API_BASE_URL}/api/weeks`);
        const trendsRes = await axios.get(`${API_BASE_URL}/api/trends`);
        weeksData = weeksRes.data;
        trendsData = trendsRes.data;
        sourceName = 'Render API';
      } catch (apiErr) {
        const staticRes = await axios.get('/data.json');
        setAllStaticData(staticRes.data);
        weeksData = staticRes.data.weeks;
        trendsData = staticRes.data.trends;
        sourceName = 'Static data.json';
      }

      if (!weeksData || weeksData.length === 0) throw new Error("No data found.");

      setWeeks(weeksData);
      setSelectedWeek(weeksData[0]);
      
      // MASTER NORMALIZATION
      const normalized = (trendsData || []).map(entry => {
        const row = { ...entry };
        Object.keys(entry).forEach(key => {
          const val = entry[key];
          const k = key.toLowerCase().replace(/[\s_]+/g, '');
          // Map any variation to the standard keys used by the charts
          if (k === 'optimismindex') row.Optimism_Metric = val;
          if (k === 'keyworddensity') row.Focus_Metric = val;
          if (k === 'topicclarity') row.Consistency_Metric = val;
        });
        return row;
      });

      // Smooth data
      const smoothed = normalized.map((entry, index, array) => {
        const start = Math.max(0, index - 2);
        const end = Math.min(array.length, index + 3);
        const window = array.slice(start, end);
        const smoothedEntry = { ...entry };
        
        ['Optimism_Metric', 'Focus_Metric', 'Consistency_Metric', 'Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'].forEach(key => {
          if (entry[key] !== undefined) {
            const avg = window.reduce((acc, curr) => acc + (curr[key] || 0), 0) / window.length;
            smoothedEntry[key] = parseFloat(avg.toFixed(3));
          }
        });
        return smoothedEntry;
      });
      
      setTrends(smoothed);
      setDebugInfo({
        source: sourceName,
        keys: smoothed.length > 0 ? Object.keys(smoothed[0]) : []
      });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWeek) {
      fetchWeekData(selectedWeek.id);
    }
  }, [selectedWeek]);

  const fetchWeekData = async (weekId) => {
    try {
      try {
        const themesRes = await axios.get(`${API_BASE_URL}/api/week/${weekId}/themes`);
        setThemes(themesRes.data);
        const songsRes = await axios.get(`${API_BASE_URL}/api/week/${weekId}/songs`);
        setSongs(songsRes.data);
      } catch (e) {
        const sWeekId = String(weekId);
        if (allStaticData?.themes_by_week) {
          setThemes(allStaticData.themes_by_week[sWeekId] || []);
          setSongs(allStaticData.songs_by_week[sWeekId] || []);
        }
      }
    } catch (err) { console.error(err); }
  };

  const themeKeys = ['Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2.2rem', margin: 0 }}>
            <TrendingUp size={32} /> Spotify Cultural Trend Analyzer
          </h1>
          <p style={{ color: '#888', margin: '5px 0 0 0' }}>Data-driven insights into the evolution of music.</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#444' }}>
          <Database size={12} style={{ marginRight: 5 }} /> {debugInfo.source} • {trends.length} points
        </div>
      </header>

      {loading ? (
        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
          <Loader2 className="animate-spin" size={48} color="#1DB954" />
          <p style={{ color: '#888' }}>Syncing Cultural Data...</p>
        </div>
      ) : (
        <>
          {/* Main Chart */}
          <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #222' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, fontSize: '1.2rem' }}>Theme Evolution</h2>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={40} />
                  <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                  <Legend />
                  {themeKeys.map((key, index) => (
                    <Line key={key} type="basis" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Metrics Row - Fixed Heights to ensure visibility */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Optimism Index', key: 'Optimism_Metric', color: '#F1C40F', desc: 'Positive vs serious lyrics.' },
              { label: 'Lyrical Focus', key: 'Focus_Metric', color: '#E67E22', desc: 'Directness of themes.' },
              { label: 'Topic Consistency', key: 'Consistency_Metric', color: '#3498DB', desc: 'Cohesion of weekly hits.' }
            ].map(m => (
              <section key={m.key} style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '12px', flex: '1 1 300px', border: '1px solid #222' }}>
                <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '0.9rem', marginBottom: '15px' }}>{m.label}</h3>
                <div style={{ height: '140px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '0.7rem' }} />
                      <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '10px' }}>{m.desc}</p>
              </section>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{selectedWeek?.date} Analysis</h2>
                <select 
                  onChange={(e) => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))}
                  style={{ backgroundColor: '#333', color: '#fff', padding: '5px', borderRadius: '4px', border: 'none', fontSize: '0.8rem' }}
                >
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themes} layout="vertical">
                    <YAxis dataKey="name" type="category" stroke="#888" width={100} tick={{ fontSize: 10 }} />
                    <XAxis type="number" hide />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                    <Bar dataKey="score">
                      {themes.map((entry, index) => <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #222' }}>
              <h2 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '20px' }}>Top 5 Songs</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {songs.slice(0, 5).map(s => (
                  <div key={s.title} style={{ backgroundColor: '#252525', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#1DB954', fontWeight: 'bold' }}>{s.rank}</span>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 'bold' }}>{s.title}</div>
                      <div style={{ color: '#666', fontSize: '0.75rem' }}>{s.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* DEBUG SECTION */}
          <div style={{ marginTop: '50px', padding: '15px', backgroundColor: '#000', borderRadius: '8px', border: '1px dashed #333', fontSize: '0.7rem', color: '#444' }}>
            <strong>Debug Data Inspector:</strong><br/>
            Detected Keys: {debugInfo.keys.join(', ')}
          </div>
        </>
      )}
    </div>
  );
};

export default App;
