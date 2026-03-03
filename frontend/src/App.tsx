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
  const [useStatic, setUseStatic] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        let tRaw = [], wRaw = [], staticObj = null;
        let forceStatic = false;
        
        try {
          const resW = await axios.get(`${API_BASE_URL}/api/weeks`);
          const resT = await axios.get(`${API_BASE_URL}/api/trends`);
          if (!Array.isArray(resW.data)) throw new Error("Not an array");
          
          // STALE API BYPASS
          if (resT.data.length > 0 && 
              resT.data[0]["Optimism_Index"] === undefined && 
              resT.data[0]["Optimism Index"] === undefined) {
             throw new Error("API missing new metrics");
          }

          wRaw = resW.data;
          tRaw = resT.data;
        } catch (e) {
          const resS = await axios.get(`/data.json?t=${Date.now()}`);
          staticObj = resS.data;
          wRaw = staticObj.weeks;
          tRaw = staticObj.trends;
          forceStatic = true;
        }

        const mapped = (tRaw || []).map(d => ({
          ...d,
          v_opt: Number(d.Optimism_Index || d["Optimism Index"] || 0),
          v_foc: Number(d.Keyword_Density || d["Keyword Density"] || 0),
          v_con: Number(d.Topic_Clarity || d["Topic Clarity"] || 0)
        }));

        const smoothed = mapped.map((entry, index, array) => {
          const start = Math.max(0, index - 2);
          const end = Math.min(array.length, index + 3);
          const window = array.slice(start, end);
          const res = { ...entry };
          ['Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'].forEach(k => {
            if (entry[k] !== undefined) {
              const avg = window.reduce((acc, curr) => acc + (Number(curr[key] || curr[k]) || 0), 0) / window.length;
              res[k] = parseFloat(avg.toFixed(4));
            }
          });
          return res;
        });

        setAllStaticData(staticObj);
        setUseStatic(forceStatic);
        setWeeks(wRaw);
        setSelectedWeek(wRaw[0]);
        setTrends(smoothed);
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      const loadWeek = async () => {
        if (useStatic && allStaticData) {
          const id = String(selectedWeek.id);
          setThemes(allStaticData.themes_by_week?.[id] || []);
          setSongs(allStaticData.songs_by_week?.[id] || []);
          return;
        }
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
  }, [selectedWeek, allStaticData, useStatic]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '25px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2.4rem', margin: 0 }}>
            <TrendingUp size={36} /> US Spotify Cultural Trends
          </h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button onClick={() => window.location.reload()} style={{ backgroundColor: '#222', color: '#888', border: '1px solid #444', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem' }}>
              <RefreshCw size={14} style={{marginRight: 8}}/> Refresh
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginTop: '25px', border: '1px solid #333' }}>
          <div style={{ marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1.3rem' }}>The Mission</h3>
            <p style={{ fontSize: '1.05rem', color: '#ccc', lineHeight: '1.6', margin: 0 }}>
              Music is the ultimate mirror of society. This tool aims to quantify the <strong>evolution of American collective consciousness</strong> by algorithmically dissecting the themes that dominate the US airwaves. By tracking these shifts over years, we can visualize how our values, anxieties, and celebrations transform in real-time.
            </p>
          </div>

          <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1.1rem', marginBottom: '15px' }}>How it Works</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px' }}>
            <div>
              <strong style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>1. US Data Sourcing</strong>
              <span style={{ color: '#888', fontSize: '0.9rem' }}>Weekly Top 200 chart data is pulled directly from the provided <strong>US-specific dataset</strong> covering 2020 to 2026.</span>
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
        <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 className="animate-spin" size={50} color="#1DB954" />
        </div>
      ) : (
        <>
          <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 /> US Cultural Theme Evolution</h2>
            <p style={{ color: '#888', marginBottom: '25px', fontSize: '0.9rem' }}>Tracks societal emotional priorities within the United States.</p>
            <div style={{ height: '380px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} key={trends.length}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Optimism Index', k: 'v_opt', color: '#F1C40F', desc: 'Positive vs Somber tone in US hits.' },
              { label: 'Lyrical Focus', k: 'v_foc', color: '#E67E22', desc: 'Theme keyword density in lyrics.' },
              { label: 'Topic Consistency', k: 'v_con', color: '#3498DB', desc: 'How unified chart hits were.' }
            ].map(m => (
              <div key={m.k} style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1DB954', marginBottom: '15px' }}>{m.label}</h3>
                <div style={{ height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} key={`${m.k}-${trends.length}`}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <YAxis domain={['dataMin', 'dataMax']} stroke="#555" tick={{fontSize: 9}} width={35} allowDecimals={true} />
                      <XAxis dataKey="date" hide />
                      <Tooltip contentStyle={{backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '11px'}} />
                      <Line type="monotone" dataKey={m.k} stroke={m.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '15px', lineHeight: '1.4' }}>{m.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '40px' }}>
            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>US Analysis: {selectedWeek?.date}</h2>
                <select onChange={e => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '0.9rem' }}>
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
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
              <h2 style={{ fontSize: '1.2rem', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><Music size={22}/> US Top Hits</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {songs.length > 0 ? songs.slice(0, 8).map(s => (
                  <div key={`${s.rank}-${s.title}`} style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#1DB954', fontWeight: 'bold', fontSize: '1.2rem', width: '25px' }}>{s.rank}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>{s.title}</div>
                      <div style={{ color: '#777', fontSize: '0.85rem' }}>{s.artist}</div>
                    </div>
                  </div>
                )) : <div style={{ color: '#444' }}>Select a week to load hits.</div>}
              </div>
            </section>
          </div>
        </>
      )}
      
      <footer style={{ marginTop: '60px', padding: '20px 0', borderTop: '1px solid #222', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
        US Spotify Cultural Trend Analyzer • Built with React & FastAPI
      </footer>
    </div>
  );
};

export default App;
