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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      let tRaw = [];
      let wRaw = [];
      
      try {
        const resW = await axios.get(`${API_BASE_URL}/api/weeks`);
        const resT = await axios.get(`${API_BASE_URL}/api/trends`);
        if (!Array.isArray(resW.data)) throw new Error();
        wRaw = resW.data;
        tRaw = resT.data;
      } catch (e) {
        const resS = await axios.get(`/data.json?t=${Date.now()}`);
        setAllStaticData(resS.data);
        wRaw = resS.data.weeks;
        tRaw = resS.data.trends;
      }

      // 1. Map to internal keys (matching data.json audit)
      const mapped = (tRaw || []).map(d => ({
        ...d,
        m_opt: d.Optimism_Index || d["Optimism Index"] || 0,
        m_foc: d.Keyword_Density || d["Keyword Density"] || 0,
        m_con: d.Topic_Clarity || d["Topic Clarity"] || 0
      }));

      // 2. Apply smoothing to EVERY line
      const smoothed = mapped.map((entry, index, array) => {
        const start = Math.max(0, index - 2);
        const end = Math.min(array.length, index + 3);
        const window = array.slice(start, end);
        const res = { ...entry };
        
        ['m_opt', 'm_foc', 'm_con', 'Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'].forEach(key => {
          if (entry[key] !== undefined) {
            const avg = window.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) / window.length;
            res[key] = parseFloat(avg.toFixed(4));
          }
        });
        return res;
      });

      setWeeks(wRaw);
      setSelectedWeek(wRaw[0]);
      setTrends(smoothed);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWeek) {
      const fetchDetails = async () => {
        try {
          const resT = await axios.get(`${API_BASE_URL}/api/week/${selectedWeek.id}/themes`);
          setThemes(resT.data);
          const resS = await axios.get(`${API_BASE_URL}/api/week/${selectedWeek.id}/songs`);
          setSongs(resS.data);
        } catch (e) {
          if (allStaticData) {
            const id = String(selectedWeek.id);
            setThemes(allStaticData.themes_by_week?.[id] || []);
            setSongs(allStaticData.songs_by_week?.[id] || []);
          }
        }
      };
      fetchDetails();
    }
  }, [selectedWeek, allStaticData]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2.5rem', margin: 0 }}>
            <TrendingUp size={40} /> Spotify Cultural Trends
          </h1>
          <button onClick={() => window.location.reload()} style={{ backgroundColor: '#222', color: '#888', border: '1px solid #444', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem' }}>
            <RefreshCw size={12} style={{marginRight: 5}}/> Refresh Page
          </button>
        </div>
        
        {/* FULL HEADER OVERVIEW RESTORED */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginTop: '20px', border: '1px solid #333' }}>
          <div style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
            <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1.2rem' }}>The Mission</h3>
            <p style={{ fontSize: '1rem', color: '#ccc', lineHeight: '1.6' }}>
              Music is the ultimate mirror of society. This tool aims to quantify the <strong>evolution of our collective consciousness</strong> by algorithmically dissecting the themes that dominate the airwaves. By tracking these shifts over years, we can visualize how our values, anxieties, and celebrations transform in real-time.
            </p>
          </div>

          <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1.1rem' }}>How it Works</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', fontSize: '0.9rem', color: '#888' }}>
            <div><strong style={{color: '#aaa'}}>1. Data Sourcing</strong><br/>Weekly chart data is pulled directly from the project's CSV dataset covering 2020 to 2026.</div>
            <div><strong style={{color: '#aaa'}}>2. Lyric Extraction</strong><br/>Full song lyrics are retrieved via the Genius API for every track in the dataset.</div>
            <div><strong style={{color: '#aaa'}}>3. NLP Analysis</strong><br/>Using Natural Language Processing (NLTK), we categorize lyrics into cultural themes based on keyword prominence and sentiment.</div>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 className="animate-spin" size={48} color="#1DB954" /></div>
      ) : (
        <>
          {/* Main Chart */}
          <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 /> Cultural Theme Evolution</h2>
            <p style={{ color: '#888', marginBottom: '25px', fontSize: '0.9rem' }}>Tracks societal emotional priorities (Romance, Resilience, etc.)</p>
            <div style={{ height: '380px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" tick={{fontSize: 10}} interval="preserveStartEnd" minTickGap={45} />
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

          {/* Metrics row - FIXED SCALING TO SHOW MOVEMENT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Optimism Index', k: 'm_opt', color: '#F1C40F', desc: 'The Mood Score: Higher means songs were generally more positive.' },
              { label: 'Lyrical Focus', k: 'm_foc', color: '#E67E22', desc: 'The Directness Score: Density of thematic keywords.' },
              { label: 'Topic Consistency', k: 'm_con', color: '#3498DB', desc: 'The Unity Score: How unified chart-topping hits were.' }
            ].map(m => (
              <div key={m.k} style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ fontSize: '1rem', color: '#1DB954', marginBottom: '15px' }}>{m.label}</h3>
                <div style={{ height: '150px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <YAxis domain={['dataMin', 'dataMax']} stroke="#444" tick={{fontSize: 9}} width={35} />
                      <XAxis dataKey="date" hide />
                      <Tooltip contentStyle={{backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '10px'}} />
                      <Line type="monotone" dataKey={m.k} stroke={m.color} strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '15px', lineHeight: '1.4' }}>{m.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '40px' }}>
            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Analysis: {selectedWeek?.date}</h2>
                <select onChange={e => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px' }}>
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>Emotional makeup of the Top 10 hits for this week.</p>
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
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><Music size={20}/> Weekly Top Hits</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {songs.length > 0 ? songs.slice(0, 8).map(s => (
                  <div key={`${s.rank}-${s.title}`} style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#1DB954', fontWeight: 'bold', width: '25px' }}>{s.rank}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{s.title}</div>
                      <div style={{ color: '#666', fontSize: '0.85rem' }}>{s.artist}</div>
                    </div>
                  </div>
                )) : <div style={{ color: '#444', padding: '20px', textAlign: 'center' }}>Loading chart data...</div>}
              </div>
            </section>
          </div>

          <div style={{ marginTop: '40px', padding: '15px', fontSize: '0.75rem', color: '#333', borderTop: '1px dashed #222' }}>
            Data Check: First Point Metrics: {trends[0]?.m_opt} / {trends[0]?.m_foc} / {trends[0]?.m_con}
          </div>
        </>
      )}
      
      <footer style={{ marginTop: '60px', padding: '20px 0', borderTop: '1px solid #222', textAlign: 'center', color: '#444', fontSize: '0.8rem' }}>
        Built with Gemini CLI • Analytics for Spotify Weekly Charts
      </footer>
    </div>
  );
};

export default App;
