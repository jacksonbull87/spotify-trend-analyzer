import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Calendar, Music, BarChart3, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

const COLORS = ['#1DB954', '#8E44AD', '#3498DB', '#E67E22', '#E74C3C', '#F1C40F'];

// Try to get Render URL from env, otherwise fallback to empty (static mode)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const App = () => {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [songs, setSongs] = useState([]);
  const [themes, setThemes] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('Checking...');

  const [allStaticData, setAllStaticData] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      let weeksData = [];
      let trendsData = [];
      
      // 1. Try Live API
      try {
        console.log("Attempting to connect to API:", API_BASE_URL);
        const weeksRes = await axios.get(`${API_BASE_URL}/api/weeks`);
        const trendsRes = await axios.get(`${API_BASE_URL}/api/trends`);
        weeksData = weeksRes.data;
        trendsData = trendsRes.data;
        setDataSource('Live API (Render)');
      } catch (apiErr) {
        // 2. Fallback to Static JSON
        console.log("API failed, trying static fallback...");
        const staticRes = await axios.get('/data.json');
        setAllStaticData(staticRes.data);
        weeksData = staticRes.data.weeks;
        trendsData = staticRes.data.trends;
        setDataSource('Static File (data.json)');
      }

      if (!weeksData || weeksData.length === 0) {
        throw new Error("No data received from any source.");
      }

      setWeeks(weeksData);
      setSelectedWeek(weeksData[0]);
      
      // 3. BULLETPROOF DATA NORMALIZATION
      // This ensures that regardless of source (Render vs Static), keys match.
      const normalizedTrends = (trendsData || []).map(entry => {
        const row = { ...entry };
        // Map any variation of keys to the one the charts use
        Object.keys(entry).forEach(key => {
          const val = entry[key];
          const k = key.toLowerCase().replace(/[\s_]+/g, '');
          
          if (k === 'optimismindex') row.Optimism_Index = val;
          if (k === 'keyworddensity') row.Keyword_Density = val;
          if (k === 'topicclarity') row.Topic_Clarity = val;
        });
        return row;
      });

      // Apply 5-period smoothing
      const smoothed = normalizedTrends.map((entry, index, array) => {
        const start = Math.max(0, index - 2);
        const end = Math.min(array.length, index + 3);
        const window = array.slice(start, end);
        
        const smoothedEntry = { ...entry };
        ['Optimism_Index', 'Keyword_Density', 'Topic_Clarity', 'Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'].forEach(key => {
          if (entry[key] !== undefined) {
            const avg = window.reduce((acc, curr) => acc + (curr[key] || 0), 0) / window.length;
            smoothedEntry[key] = parseFloat(avg.toFixed(3));
          }
        });
        return smoothedEntry;
      });
      
      setTrends(smoothed);
      setLoading(false);
    } catch (err) {
      console.error("Critical Load Error:", err);
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
        if (allStaticData && allStaticData.themes_by_week) {
          setThemes(allStaticData.themes_by_week[sWeekId] || []);
          setSongs(allStaticData.songs_by_week[sWeekId] || []);
        }
      }
    } catch (err) {
      console.error("Error fetching week details:", err);
    }
  };

  const themeKeys = ['Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2.5rem', margin: 0 }}>
            <TrendingUp size={40} />
            Spotify Cultural Trend Analyzer
          </h1>
          <p style={{ color: '#888', fontSize: '1.1rem', marginTop: '5px' }}>Tracking the heartbeat of culture through music.</p>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#444', textAlign: 'right' }}>
          Source: {dataSource}<br/>
          Data Points: {trends.length}
        </div>
      </header>

      {error && (
        <div style={{ backgroundColor: '#441111', border: '1px solid #ff4444', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><AlertCircle /> Error Loading Data</h3>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
          <Loader2 className="animate-spin text-green-500" size={48} />
          <p style={{ color: '#888' }}>Analyzing Cultural Metrics...</p>
        </div>
      ) : (
        <>
          {/* MAIN CHART */}
          <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginBottom: '30px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}><BarChart3 size={24} /> Theme Evolution</h2>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={40} />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                  <Legend />
                  {themeKeys.map((key, index) => (
                    <Line key={key} type="basis" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* THE 3 SMALLER GRAPHS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {/* Optimism */}
            <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #222' }}>
              <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1rem' }}>Optimism Index</h3>
              <div style={{ height: '150px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['auto', 'auto']} stroke="#444" tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '0.8rem' }} />
                    <Line type="basis" dataKey="Optimism_Index" stroke="#F1C40F" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '10px' }}>Higher = More positive and upbeat lyrics.</p>
            </section>

            {/* Focus */}
            <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #222' }}>
              <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1rem' }}>Lyrical Focus</h3>
              <div style={{ height: '150px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['auto', 'auto']} stroke="#444" tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '0.8rem' }} />
                    <Line type="basis" dataKey="Keyword_Density" stroke="#E67E22" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '10px' }}>Higher = More direct use of thematic keywords.</p>
            </section>

            {/* Consistency */}
            <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #222' }}>
              <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1rem' }}>Topic Consistency</h3>
              <div style={{ height: '150px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['auto', 'auto']} stroke="#444" tick={{ fontSize: 8 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '0.8rem' }} />
                    <Line type="basis" dataKey="Topic_Clarity" stroke="#3498DB" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '10px' }}>Higher = Most songs are about the same subject.</p>
            </section>
          </div>

          {/* WEEKLY DETAIL SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '40px' }}>
            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><Calendar size={24} /> {selectedWeek?.date} Themes</h2>
                <select 
                  onChange={(e) => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))}
                  style={{ backgroundColor: '#333', color: '#fff', padding: '8px', borderRadius: '6px', border: 'none' }}
                >
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#888" hide />
                    <YAxis dataKey="name" type="category" stroke="#888" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                    <Bar dataKey="score">
                      {themes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, marginBottom: '20px' }}>
                <Music size={24} /> Top Songs
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {songs.slice(0, 5).map(song => (
                  <div key={`${song.rank}-${song.title}`} style={{ backgroundColor: '#2a2a2a', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1DB954', width: '25px' }}>{song.rank}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{song.title}</div>
                      <div style={{ color: '#888', fontSize: '0.85rem' }}>{song.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#444', fontSize: '0.8rem', borderTop: '1px solid #222', paddingTop: '20px' }}>
        Built with Gemini CLI • FastAPI • React • SQLite
      </footer>
    </div>
  );
};

export default App;
