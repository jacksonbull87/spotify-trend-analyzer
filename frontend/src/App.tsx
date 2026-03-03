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
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      let tData = [];
      let wData = [];
      
      try {
        const resW = await axios.get(`${API_BASE_URL}/api/weeks`);
        const resT = await axios.get(`${API_BASE_URL}/api/trends`);
        wData = resW.data;
        tData = resT.data;
      } catch (e) {
        const resS = await axios.get(`/data.json?t=${Date.now()}`);
        wData = resS.data.weeks;
        tData = resS.data.trends;
      }

      // 1. Map keys to consistent short names
      const mapped = tData.map(d => ({
        ...d,
        opt: d.Optimism_Index || d["Optimism Index"] || 0,
        foc: d.Keyword_Density || d["Keyword Density"] || 0,
        con: d.Topic_Clarity || d["Topic Clarity"] || 0
      }));

      // 2. Smooth data (using the correct keys)
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

      setWeeks(wData);
      setSelectedWeek(wData[0]);
      setTrends(smoothed);
      setLoading(false);
    } catch (err) {
      setError("Data load error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWeek) {
      const loadWeek = async () => {
        try {
          const resT = await axios.get(`${API_BASE_URL}/api/week/${selectedWeek.id}/themes`);
          setThemes(resT.data);
          const resS = await axios.get(`${API_BASE_URL}/api/week/${selectedWeek.id}/songs`);
          setSongs(resS.data);
        } catch (e) {}
      };
      loadWeek();
    }
  }, [selectedWeek]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        <h1 style={{ color: '#1DB954', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp /> Cultural Trends</h1>
        <button onClick={() => window.location.reload()} style={{ backgroundColor: '#222', color: '#888', border: '1px solid #444', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem' }}>
          Force Refresh
        </button>
      </header>

      {loading ? (
        <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 className="animate-spin" size={40} color="#1DB954" /></div>
      ) : (
        <>
          <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 20px 0' }}>Theme Evolution (Smoothed)</h2>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" tick={{fontSize: 10}} interval="preserveStartEnd" minTickGap={40} />
                  <YAxis stroke="#666" tick={{fontSize: 10}} />
                  <Tooltip contentStyle={{backgroundColor: '#1e1e1e', border: '1px solid #333'}} />
                  <Legend />
                  {['Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'].map((k, i) => (
                    <Line key={k} type="basis" dataKey={k} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Optimism Index', k: 'opt', color: '#F1C40F', domain: [0.3, 0.9] },
              { label: 'Lyrical Focus', k: 'foc', color: '#E67E22', domain: [0, 0.3] },
              { label: 'Topic Consistency', k: 'con', color: '#3498DB', domain: [1, 3] }
            ].map(m => (
              <div key={m.k} style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ fontSize: '0.85rem', color: '#1DB954', marginBottom: '10px' }}>{m.label}</h3>
                <div style={{ height: '120px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <YAxis domain={m.domain} hide />
                      <XAxis dataKey="date" hide />
                      <Tooltip contentStyle={{backgroundColor: '#1e1e1e', fontSize: '10px'}} />
                      <Line type="basis" dataKey={m.k} stroke={m.color} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>{selectedWeek?.date}</h2>
                <select onChange={e => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themes} layout="vertical">
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9}} stroke="#888" />
                    <XAxis type="number" hide />
                    <Bar dataKey="score">
                      {themes.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '1rem', margin: '0 0 20px 0' }}>Top Hits</h2>
              {songs.slice(0, 5).map(s => (
                <div key={`${s.rank}-${s.title}`} style={{ padding: '8px 0', borderBottom: '1px solid #222', fontSize: '0.85rem' }}>
                  <span style={{ color: '#1DB954', fontWeight: 'bold', marginRight: '10px' }}>{s.rank}</span> {s.title}
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
