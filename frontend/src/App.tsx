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
  const [stats, setStats] = useState({ source: 'Checking...' });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      let tData = [];
      let wData = [];
      let sourceName = 'API';
      let staticObj = null;
      
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
        sourceName = 'Local Static Data';
      }

      // Normalize keys to underscores for internal consistency
      const normalized = (tData || []).map(entry => {
        const row = { ...entry };
        Object.keys(entry).forEach(key => {
          if (key.includes(' ')) {
            row[key.replace(/\s+/g, '_')] = entry[key];
          }
        });
        return row;
      });

      // Smooth only the main theme categories
      const mainThemeKeys = ['Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'];
      const smoothed = normalized.map((entry, index, array) => {
        const start = Math.max(0, index - 2);
        const end = Math.min(array.length, index + 3);
        const window = array.slice(start, end);
        const smoothedEntry = { ...entry };
        
        mainThemeKeys.forEach(key => {
          if (entry[key] !== undefined) {
            const avg = window.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) / window.length;
            smoothedEntry[key] = parseFloat(avg.toFixed(4));
          }
        });
        return smoothedEntry;
      });

      setAllStaticData(staticObj);
      setWeeks(wData);
      setSelectedWeek(wData[0]);
      setTrends(smoothed);
      setStats({ source: sourceName });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWeek) {
      const loadDetails = async () => {
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
      loadDetails();
    }
  }, [selectedWeek, allStaticData]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2.5rem', margin: 0 }}>
            <TrendingUp size={40} /> Spotify Cultural Trends
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ padding: '5px 12px', backgroundColor: '#1a1a1a', borderRadius: '20px', fontSize: '0.7rem', border: '1px solid #333', color: '#666' }}>
              Data: {stats.source}
            </div>
            <button onClick={() => window.location.reload()} style={{ backgroundColor: '#222', color: '#888', border: '1px solid #444', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>
        
        {/* RESTORED MISSION AND OVERVIEW */}
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
          <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 /> Cultural Theme Evolution</h2>
            <p style={{ color: '#888', marginBottom: '25px', fontSize: '0.9rem' }}>
              This chart tracks how the "mood" of the country has shifted. By following these lines, you can see when society leaned into Romance, sought Resilience during tough times, or embraced Melancholy.
            </p>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Optimism Index', k: 'Optimism_Index', color: '#F1C40F', desc: 'The Mood Score: Higher points mean songs were generally more positive and upbeat.' },
              { label: 'Lyrical Focus', k: 'Keyword_Density', color: '#E67E22', desc: 'The Directness Score: High scores mean songs used clear keywords about their themes.' },
              { label: 'Topic Consistency', k: 'Topic_Clarity', color: '#3498DB', desc: 'The Unity Score: High scores mean top hits were all singing about the same core subject.' }
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
                      <Line type="monotone" dataKey={m.k} stroke={m.color} strokeWidth={2} dot={false} isAnimationActive={false} />
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
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Themes for {selectedWeek?.date}</h2>
                <select onChange={e => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 10px' }}>
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>Deep-dive into the specific emotional makeup of the Top 10 hits for this week.</p>
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
                )) : <div style={{ color: '#444', padding: '20px', textAlign: 'center' }}>Loading chart data...</div>}
              </div>
            </section>
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
