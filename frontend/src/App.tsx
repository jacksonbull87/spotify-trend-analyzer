import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Calendar, Music, BarChart3, RefreshCw, Loader2 } from 'lucide-react';

const COLORS = ['#1DB954', '#8E44AD', '#3498DB', '#E67E22', '#E74C3C', '#F1C40F'];
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const App = () => {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [songs, setSongs] = useState([]);
  const [themes, setThemes] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allStaticData, setAllStaticData] = useState(null);
  const [stats, setStats] = useState({ opt: '', foc: '', con: '', source: '' });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      let tData = [];
      let wData = [];
      let source = 'API';
      
      try {
        const resW = await axios.get(`${API_BASE_URL}/api/weeks`);
        if (!Array.isArray(resW.data)) throw new Error();
        const resT = await axios.get(`${API_BASE_URL}/api/trends`);
        wData = resW.data;
        tData = resT.data;
      } catch (e) {
        const resS = await axios.get(`/data.json?t=${Date.now()}`);
        setAllStaticData(resS.data);
        wData = resS.data.weeks;
        tData = resS.data.trends;
        source = 'File';
      }

      // 1. Map keys to consistent short names
      const mapped = (tData || []).map(d => ({
        ...d,
        opt: Number(d.Optimism_Index || d["Optimism Index"] || 0),
        foc: Number(d.Keyword_Density || d["Keyword Density"] || 0),
        con: Number(d.Topic_Clarity || d["Topic Clarity"] || 0)
      }));

      // 2. Apply 5-period smoothing to ALL keys
      const smoothed = mapped.map((entry, index, array) => {
        const start = Math.max(0, index - 2);
        const end = Math.min(array.length, index + 3);
        const window = array.slice(start, end);
        const smoothedEntry = { ...entry };
        
        ['opt', 'foc', 'con', 'Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'].forEach(key => {
          if (entry[key] !== undefined) {
            const avg = window.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) / window.length;
            smoothedEntry[key] = parseFloat(avg.toFixed(4));
          }
        });
        return smoothedEntry;
      });

      const getRange = (key) => {
        const vals = smoothed.map(m => m[key]).filter(v => v > 0);
        return vals.length ? `${Math.min(...vals).toFixed(2)}-${Math.max(...vals).toFixed(2)}` : '0';
      };

      setStats({ opt: getRange('opt'), foc: getRange('foc'), con: getRange('con'), source: source });
      setWeeks(wData);
      setSelectedWeek(wData[0]);
      setTrends(smoothed);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWeek) {
      const loadWeekDetails = async () => {
        try {
          const resT = await axios.get(`${API_BASE_URL}/api/week/${selectedWeek.id}/themes`);
          if (!Array.isArray(resT.data)) throw new Error();
          setThemes(resT.data);
          const resS = await axios.get(`${API_BASE_URL}/api/week/${selectedWeek.id}/songs`);
          setSongs(resS.data);
        } catch (e) {
          if (allStaticData) {
            const idKey = String(selectedWeek.id);
            setThemes(allStaticData.themes_by_week?.[idKey] || []);
            setSongs(allStaticData.songs_by_week?.[idKey] || []);
          }
        }
      };
      loadWeekDetails();
    }
  }, [selectedWeek, allStaticData]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#1DB954', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem' }}><TrendingUp /> Cultural Trends</h1>
          <p style={{ color: '#666', fontSize: '0.85rem', margin: '5px 0 0 0' }}>Data Source: {stats.source}</p>
        </div>
        <button onClick={() => window.location.reload()} style={{ backgroundColor: '#222', color: '#888', border: '1px solid #444', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={14} /> Force Refresh
        </button>
      </header>

      {loading ? (
        <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 className="animate-spin" size={40} color="#1DB954" /></div>
      ) : (
        <>
          <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 size={20}/> Cultural Theme Evolution</h2>
            <p style={{ color: '#888', marginBottom: '25px', fontSize: '0.9rem' }}>
              This chart tracks how the "mood" of the country has shifted. By following these lines, you can see when society leaned into Romance, sought Resilience during tough times, or embraced Melancholy.
            </p>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" tick={{fontSize: 10}} interval="preserveStartEnd" minTickGap={40} />
                  <YAxis stroke="#666" tick={{fontSize: 10}} />
                  <Tooltip contentStyle={{backgroundColor: '#1e1e1e', border: '1px solid #333'}} />
                  <Legend />
                  {['Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'].map((k, i) => (
                    <Line key={k} type="basis" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Optimism Index', k: 'opt', color: '#F1C40F', desc: 'The Mood Score: Higher means songs were generally more positive and upbeat.' },
              { label: 'Lyrical Focus', k: 'foc', color: '#E67E22', desc: 'The Directness Score: High scores mean songs used clear keywords about their themes.' },
              { label: 'Topic Consistency', k: 'con', color: '#3498DB', desc: 'The Unity Score: High scores mean top hits were all singing about the same core subject.' }
            ].map(m => (
              <div key={m.k} style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ fontSize: '0.95rem', color: '#1DB954', marginBottom: '15px' }}>{m.label}</h3>
                <div style={{ height: '140px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <YAxis domain={['dataMin', 'dataMax']} stroke="#444" tick={{fontSize: 8}} width={35} />
                      <XAxis dataKey="date" hide />
                      <Tooltip contentStyle={{backgroundColor: '#1e1e1e', fontSize: '10px'}} />
                      <Line type="basis" dataKey={m.k} stroke={m.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#777', marginTop: '15px', lineHeight: '1.4' }}>{m.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '40px' }}>
            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Themes for {selectedWeek?.date}</h2>
                <select onChange={e => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px', fontSize: '0.85rem' }}>
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>Deep-dive into the specific emotional makeup of the Top 10 hits.</p>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 10}} stroke="#888" />
                    <XAxis type="number" hide />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                    <Bar dataKey="score">
                      {themes.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #222' }}>
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><Music size={20}/> Top Hits This Week</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {songs.length > 0 ? songs.slice(0, 8).map(s => (
                  <div key={`${s.rank}-${s.title}`} style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#1DB954', fontWeight: 'bold', width: '25px' }}>{s.rank}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{s.title}</div>
                      <div style={{ color: '#666', fontSize: '0.85rem' }}>{s.artist}</div>
                    </div>
                  </div>
                )) : <div style={{ color: '#444', padding: '20px', textAlign: 'center' }}>Loading song data...</div>}
              </div>
            </section>
          </div>
        </>
      )}
      
      <footer style={{ marginTop: '60px', padding: '20px 0', borderTop: '1px solid #222', textAlign: 'center', color: '#444', fontSize: '0.8rem' }}>
        Built with Gemini CLI • Cultural Analytics Engine
      </footer>
    </div>
  );
};

export default App;
