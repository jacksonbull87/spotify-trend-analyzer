import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Calendar, Music, BarChart3, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

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

  const [allStaticData, setAllStaticData] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      let weeksData, trendsData;
      try {
        const weeksRes = await axios.get(`${API_BASE_URL}/api/weeks`);
        weeksData = weeksRes.data;
        const trendsRes = await axios.get(`${API_BASE_URL}/api/trends`);
        trendsData = trendsRes.data;
      } catch (e) {
        console.log("Live API not found, falling back to static data.json");
        const staticRes = await axios.get('/data.json');
        setAllStaticData(staticRes.data);
        weeksData = staticRes.data.weeks;
        trendsData = staticRes.data.trends;
      }

      if (!weeksData || weeksData.length === 0) {
        throw new Error("No data found in API or static source.");
      }

      setWeeks(weeksData);
      setSelectedWeek(weeksData[0]);
      
      setTimeout(() => {
        const rawData = (trendsData || []).map(entry => {
          const normalized = { ...entry };
          Object.keys(entry).forEach(k => {
            if (k.includes(' ')) {
              normalized[k.replace(/\s+/g, '_')] = entry[k];
            }
          });
          return normalized;
        });

        const smoothed = rawData.map((entry, index, array) => {
          const start = Math.max(0, index - 2);
          const end = Math.min(array.length, index + 3);
          const window = array.slice(start, end);
          
          const smoothedEntry = { ...entry };
          Object.keys(entry).forEach(key => {
            if (key !== 'date' && typeof entry[key] === 'number') {
              const avg = window.reduce((acc, curr) => acc + (curr[key] || 0), 0) / window.length;
              smoothedEntry[key] = parseFloat(avg.toFixed(3));
            }
          });
          return smoothedEntry;
        });
        
        console.log("Final Trends Data:", smoothed[0]);
        setTrends(smoothed);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Critical error:", err);
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
        setThemes(themesRes.data.map(t => ({ ...t, name: t.name.replace(/\s+/g, "_") })));
        const songsRes = await axios.get(`${API_BASE_URL}/api/week/${weekId}/songs`);
        setSongs(songsRes.data);
      } catch (e) {
        const sWeekId = String(weekId);
        if (allStaticData) {
          const staticThemes = allStaticData.themes_by_week[sWeekId] || [];
          setThemes(staticThemes.map(t => ({ ...t, name: t.name.replace(/\s+/g, "_") })));
          setSongs(allStaticData.songs_by_week[sWeekId] || []);
        }
      }
    } catch (err) {
      console.error("Error fetching week data:", err);
    }
  };

  const themeKeys = trends.length > 0 ? Object.keys(trends[0]).filter(k => 
    k !== 'date' && !['Optimism_Index', 'Keyword_Density', 'Topic_Clarity', 'Optimism Index', 'Keyword Density', 'Topic Clarity'].includes(k)
  ) : [];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2.5rem' }}>
          <TrendingUp size={40} />
          Spotify Cultural Trend Analyzer
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Analyzing top charts to track the heartbeat of culture.</p>
      </header>

      {error && (
        <div style={{ backgroundColor: '#441111', border: '1px solid #ff4444', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <AlertCircle color="#ff4444" />
          <div>
            <h3 style={{ margin: 0 }}>System Error</h3>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
          <Loader2 className="animate-spin text-green-500" size={48} />
          <p style={{ color: '#888' }}>Initializing Cultural Analysis Engine...</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '40px' }}>
            {/* Main Theme Trends */}
            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                <BarChart3 size={24} /> Cultural Theme Evolution
              </h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.95rem' }}>
                This chart tracks how the "mood" of the country has shifted across major themes.
              </p>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} interval="preserveStartEnd" minTickGap={50} />
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

            {/* Metrics Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {/* Optimism Index */}
              <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', flex: '1 1 300px', minWidth: '300px' }}>
                <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1rem' }}>Optimism Index</h3>
                <div style={{ height: '160px', width: '100%', borderBottom: '1px solid #222' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#444" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '0.8rem' }} />
                      <Line type="monotone" dataKey="Optimism_Index" stroke="#F1C40F" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}><strong>The "Mood" Score:</strong> Tracks positive vs. serious lyrics.</p>
              </section>

              {/* Keyword Density */}
              <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', flex: '1 1 300px', minWidth: '300px' }}>
                <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1rem' }}>Lyrical Focus</h3>
                <div style={{ height: '160px', width: '100%', borderBottom: '1px solid #222' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#444" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '0.8rem' }} />
                      <Line type="monotone" dataKey="Keyword_Density" stroke="#E67E22" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}><strong>The "Directness" Score:</strong> Tracks theme keyword prominence.</p>
              </section>

              {/* Topic Clarity */}
              <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', flex: '1 1 300px', minWidth: '300px' }}>
                <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1rem' }}>Topic Consistency</h3>
                <div style={{ height: '160px', width: '100%', borderBottom: '1px solid #222' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#444" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '0.8rem' }} />
                      <Line type="monotone" dataKey="Topic_Clarity" stroke="#3498DB" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '10px' }}><strong>The "Unity" Score:</strong> Tracks cohesion of weekly chart topics.</p>
              </section>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
                  <Calendar size={24} /> Themes for {selectedWeek?.date}
                </h2>
                <select 
                  onChange={(e) => setSelectedWeek(weeks.find(w => w.id == e.target.value))}
                  style={{ backgroundColor: '#333', color: '#fff', padding: '5px', borderRadius: '4px', border: 'none' }}
                >
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#888" />
                    <YAxis dataKey="name" type="category" stroke="#888" width={100} tick={{ fontSize: 10 }} />
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
          </div>

          <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
              <Music size={24} /> Chart Songs for {selectedWeek?.date}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
              {songs.map(song => (
                <div key={`${song.rank}-${song.title}`} style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1DB954', minWidth: '30px' }}>{song.rank}</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{song.title}</div>
                    <div style={{ color: '#888', fontSize: '0.9rem' }}>{song.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#555', fontSize: '0.9rem' }}>
        <p>Built with Gemini CLI & FastAPI & React</p>
      </footer>
    </div>
  );
};

export default App;
