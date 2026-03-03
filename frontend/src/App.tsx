import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Calendar, Music, BarChart3, ChevronRight, Loader2, AlertCircle, Database, Layout } from 'lucide-react';

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
      let tData = [];
      let wData = [];
      
      // 1. ATTEMPT LIVE API
      try {
        const resW = await axios.get(`${API_BASE_URL}/api/weeks`);
        // Crucial: check if we actually got an array (not an HTML redirect string)
        if (!Array.isArray(resW.data)) throw new Error("API did not return JSON");
        
        const resT = await axios.get(`${API_BASE_URL}/api/trends`);
        wData = resW.data;
        tData = resT.data;
        console.log("Connected to Live API");
      } catch (e) {
        // 2. STATIC FALLBACK
        console.log("API not available, loading local data.json...");
        const resS = await axios.get('/data.json');
        wData = resS.data.weeks;
        tData = resS.data.trends;
        setAllStaticData(resS.data);
      }

      if (!tData || tData.length === 0) throw new Error("Could not find trends data.");

      // 3. ROBUST DATA MAPPING
      const processed = tData.map(entry => {
        const row = { ...entry };
        Object.keys(entry).forEach(key => {
          const val = entry[key];
          const k = key.toLowerCase().replace(/[\s_]+/g, '');
          
          if (k === 'optimismindex') row.opt_val = val;
          if (k === 'keyworddensity' || k === 'lyricalfocus') row.foc_val = val;
          if (k === 'topicclarity' || k === 'topicconsistency') row.con_val = val;
        });
        return row;
      });

      setWeeks(wData);
      setSelectedWeek(wData[0]);
      setTrends(processed);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWeek) {
      const fetchDetails = async () => {
        try {
          const resT = await axios.get(`${API_BASE_URL}/api/week/${selectedWeek.id}/themes`);
          if (Array.isArray(resT.data)) {
            setThemes(resT.data);
            const resS = await axios.get(`${API_BASE_URL}/api/week/${selectedWeek.id}/songs`);
            setSongs(resS.data);
          } else { throw new Error(); }
        } catch (e) {
          if (allStaticData?.themes_by_week) {
            const id = String(selectedWeek.id);
            setThemes(allStaticData.themes_by_week[id] || []);
            setSongs(allStaticData.songs_by_week[id] || []);
          }
        }
      };
      fetchDetails();
    }
  }, [selectedWeek, allStaticData]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2.2rem', margin: 0 }}>
          <TrendingUp size={36} /> Spotify Cultural Trends
        </h1>
        <p style={{ color: '#888', margin: '5px 0 0 0' }}>Analyzing the shifts in musical consciousness from 2020 to 2026.</p>
      </header>

      {error && (
        <div style={{ backgroundColor: '#441111', border: '1px solid #ff4444', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 className="animate-spin" size={48} color="#1DB954" />
        </div>
      ) : (
        <>
          {/* Main Evolution Chart */}
          <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Layout size={20}/> Major Theme Evolution</h2>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" tick={{fontSize: 10}} interval="preserveStartEnd" minTickGap={45} />
                  <YAxis stroke="#666" tick={{fontSize: 10}} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                  <Legend />
                  {['Romance', 'Party/Celebration', 'Resilience/Success', 'Melancholy', 'Social/Identity', 'Nostalgia'].map((key, i) => (
                    <Line key={key} type="basis" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Optimism Index', key: 'opt_val', color: '#F1C40F', desc: 'Positive vs Somber tone.' },
              { label: 'Lyrical Focus', key: 'foc_val', color: '#E67E22', desc: 'Thematic keyword density.' },
              { label: 'Topic Consistency', key: 'con_val', color: '#3498DB', desc: 'How similar chart hits are.' }
            ].map(m => (
              <div key={m.key} style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#1DB954', marginBottom: '15px' }}>{m.label}</h3>
                <div style={{ height: '140px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis domain={['auto', 'auto']} stroke="#444" tick={{fontSize: 8}} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '0.7rem' }} />
                      <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '15px' }}>{m.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
            {/* Weekly Themes */}
            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Week of {selectedWeek?.date}</h2>
                <select 
                  onChange={(e) => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))}
                  style={{ backgroundColor: '#333', color: '#fff', padding: '6px', borderRadius: '4px', border: 'none', fontSize: '0.85rem' }}
                >
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themes} layout="vertical">
                    <YAxis dataKey="name" type="category" stroke="#888" width={110} tick={{fontSize: 10}} />
                    <XAxis type="number" hide />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                    <Bar dataKey="score">
                      {themes.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Top Songs */}
            <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', border: '1px solid #222' }}>
              <h2 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Music size={18}/> Weekly Top Hits</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {songs.slice(0, 5).map(s => (
                  <div key={`${s.rank}-${s.title}`} style={{ backgroundColor: '#252525', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ color: '#1DB954', fontWeight: 'bold', fontSize: '1.1rem', width: '25px' }}>{s.rank}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{s.title}</div>
                      <div style={{ color: '#666', fontSize: '0.85rem' }}>{s.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
      
      <footer style={{ marginTop: '60px', padding: '20px 0', borderTop: '1px solid #222', textAlign: 'center', color: '#444', fontSize: '0.8rem' }}>
        Built with Gemini CLI • Powered by Spotify & Genius Data
      </footer>
    </div>
  );
};

export default App;
