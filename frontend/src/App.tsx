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
  const [bounds, setBounds] = useState({ opt: [0,1], foc: [0,1], con: [0,1] });

  useEffect(() => {
    const start = async () => {
      try {
        setLoading(true);
        let tData, wData, staticObj;
        try {
          const resW = await axios.get(`${API_BASE_URL}/api/weeks`);
          const resT = await axios.get(`${API_BASE_URL}/api/trends`);
          if (!Array.isArray(resW.data)) throw new Error();
          wData = resW.data;
          tData = resT.data;
        } catch (e) {
          const resS = await axios.get(`/data.json?t=${Date.now()}`);
          staticObj = resS.data;
          wData = staticObj.weeks;
          tData = staticObj.trends;
        }

        const mapped = (tData || []).map(d => ({
          ...d,
          m_opt: Number(d.Optimism_Index || d["Optimism Index"] || 0),
          m_foc: Number(d.Keyword_Density || d["Keyword Density"] || 0),
          m_con: Number(d.Topic_Clarity || d["Topic Clarity"] || 0)
        }));

        // Calculate Manual Bounds to Force Scaling
        const getB = (k, pad) => {
          const vs = mapped.map(d => d[k]).filter(v => v > 0);
          return vs.length ? [Math.min(...vs) - pad, Math.max(...vs) + pad] : [0, 1];
        };

        setBounds({
          opt: getB('m_opt', 0.05),
          foc: getB('m_foc', 0.02),
          con: getB('m_con', 0.2)
        });

        // Smooth main themes
        const mainKeys = ['Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'];
        const smoothed = mapped.map((entry, index, array) => {
          const startIdx = Math.max(0, index - 2);
          const endIdx = Math.min(array.length, index + 3);
          const window = array.slice(startIdx, endIdx);
          const res = { ...entry };
          mainKeys.forEach(k => {
            if (entry[k] !== undefined) {
              const avg = window.reduce((acc, curr) => acc + (Number(curr[k]) || 0), 0) / window.length;
              res[k] = parseFloat(avg.toFixed(4));
            }
          });
          return res;
        });

        setAllStaticData(staticObj);
        setWeeks(wData);
        setSelectedWeek(wData[0]);
        setTrends(smoothed);
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    start();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      const loadWeek = async () => {
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
      loadWeek();
    }
  }, [selectedWeek, allStaticData]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '25px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2.4rem', margin: 0 }}>
            <TrendingUp size={36} /> Spotify Cultural Trends
          </h1>
          <button onClick={() => window.location.reload()} style={{ backgroundColor: '#222', color: '#888', border: '1px solid #444', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={14} /> Refresh Application
          </button>
        </div>

        {/* RESTORED MISSION AND OVERVIEW */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginTop: '25px', border: '1px solid #333' }}>
          <div style={{ marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1.3rem' }}>The Mission</h3>
            <p style={{ fontSize: '1.05rem', color: '#ccc', lineHeight: '1.6', margin: 0 }}>
              Music is the ultimate mirror of society. This tool aims to quantify the <strong>evolution of our collective consciousness</strong> by algorithmically dissecting the themes that dominate the airwaves. By tracking these shifts over years, we can visualize how our values, anxieties, and celebrations transform in real-time.
            </p>
          </div>

          <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1.1rem', marginBottom: '15px' }}>How it Works</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
            <div>
              <strong style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>1. Data Sourcing</strong>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>Weekly Top 200 chart data is pulled directly from the provided dataset covering 2020 to 2026.</span>
            </div>
            <div>
              <strong style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>2. Lyric Extraction</strong>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>Full song lyrics are retrieved via the Genius API for every track in the charting history.</span>
            </div>
            <div>
              <strong style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>3. NLP Analysis</strong>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>Using Natural Language Processing (NLTK), we categorize lyrics into themes based on keyword prominence and sentiment.</span>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 className="animate-spin" size={50} color="#1DB954" /></div>
      ) : (
        <>
          {/* Main Chart */}
          <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 /> Cultural Theme Evolution</h2>
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

          {/* Metrics row - FORCED SCALING */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Optimism Index', k: 'm_opt', color: '#F1C40F', domain: bounds.opt },
              { label: 'Lyrical Focus', k: 'm_foc', color: '#E67E22', domain: bounds.foc },
              { label: 'Topic Consistency', k: 'm_con', color: '#3498DB', domain: bounds.con }
            ].map(m => (
              <div key={m.k} style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1DB954', marginBottom: '15px' }}>{m.label}</h3>
                <div style={{ height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <YAxis domain={m.domain} stroke="#555" tick={{fontSize: 9}} width={35} allowDecimals={true} />
                      <XAxis dataKey="date" hide />
                      <Tooltip contentStyle={{backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '11px'}} />
                      <Line type="monotone" dataKey={m.k} stroke={m.color} strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '40px' }}>
            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Analysis: {selectedWeek?.date}</h2>
                <select onChange={e => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px' }}>
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themes} layout="vertical">
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
              <h2 style={{ fontSize: '1.2rem', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><Music /> Top hits</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {songs.length > 0 ? songs.slice(0, 8).map(s => (
                  <div key={`${s.rank}-${s.title}`} style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#1DB954', fontWeight: 'bold', fontSize: '1.2rem', width: '25px' }}>{s.rank}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>{s.title}</div>
                      <div style={{ color: '#777', fontSize: '0.85rem' }}>{s.artist}</div>
                    </div>
                  </div>
                )) : <div style={{ color: '#444' }}>Select a week.</div>}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
