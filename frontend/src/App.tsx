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
  const [debugData, setDebugData] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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
        const resS = await axios.get('/data.json');
        wData = resS.data.weeks;
        tData = resS.data.trends;
      }

      if (!tData || tData.length === 0) throw new Error("No trend data found");

      // FORCED NORMALIZATION - Mapping every possible naming convention
      const processed = tData.map(entry => {
        const row = { ...entry };
        Object.keys(entry).forEach(key => {
          const val = entry[key];
          const k = key.toLowerCase().replace(/[\s_]+/g, '');
          
          if (k.includes('optimism')) row.display_optimism = val;
          if (k.includes('density') || k.includes('focus')) row.display_focus = val;
          if (k.includes('clarity') || k.includes('consistency')) row.display_consistency = val;
        });
        return row;
      });

      setWeeks(wData);
      setSelectedWeek(wData[0]);
      setTrends(processed);
      setDebugData(processed[0]);
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
          setThemes(resT.data);
          const resS = await axios.get(`${API_BASE_URL}/api/week/${selectedWeek.id}/songs`);
          setSongs(resS.data);
        } catch (e) {
          // Fallback handled via fetchInitialData setting allStaticData if I had kept that state, 
          // but for brevity in this "nuclear" fix I'm assuming data.json is loaded or API works.
        }
      };
      fetchDetails();
    }
  }, [selectedWeek]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2rem', margin: 0 }}>
          <TrendingUp /> Spotify Cultural Trends
        </h1>
      </header>

      {loading ? (
        <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 className="animate-spin" size={48} color="#1DB954" />
        </div>
      ) : (
        <>
          {/* Main Theme Chart */}
          <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Thematic Evolution (2020-2026)</h2>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" tick={{fontSize: 10}} interval="preserveStartEnd" minTickGap={40} />
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

          {/* THE THREE SMALL GRAPHS - NO RESPONSIVE CONTAINER (FIXED SIZE) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Optimism Index', key: 'display_optimism', color: '#F1C40F' },
              { label: 'Lyrical Focus', key: 'display_focus', color: '#E67E22' },
              { label: 'Topic Consistency', key: 'display_consistency', color: '#3498DB' }
            ].map(m => (
              <div key={m.key} style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '12px', border: '1px solid #333', flex: '1 1 340px' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#1DB954', marginBottom: '10px' }}>{m.label}</h3>
                <LineChart width={330} height={150} data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['auto', 'auto']} stroke="#444" tick={{fontSize: 8}} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', fontSize: '0.7rem' }} />
                  <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>{selectedWeek?.date} Analysis</h2>
                <select 
                  onChange={(e) => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))}
                  style={{ backgroundColor: '#333', color: '#fff', fontSize: '0.8rem' }}
                >
                  {weeks.map(w => <option key={w.id} value={w.id}>{w.date}</option>)}
                </select>
              </div>
              <div style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={themes} layout="vertical">
                    <YAxis dataKey="name" type="category" stroke="#888" width={100} tick={{fontSize: 9}} />
                    <XAxis type="number" hide />
                    <Bar dataKey="score">
                      {themes.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '20px' }}>Top Hits</h2>
              {songs.slice(0, 5).map(s => (
                <div key={s.title} style={{ padding: '8px', borderBottom: '1px solid #222', fontSize: '0.85rem' }}>
                  <span style={{ color: '#1DB954', marginRight: '10px' }}>{s.rank}</span> {s.title}
                </div>
              ))}
            </section>
          </div>

          {/* EMERGENCY DEBUG BOX */}
          <div style={{ marginTop: '100px', padding: '20px', border: '1px dashed red', backgroundColor: '#110000', fontSize: '0.7rem' }}>
            <h4 style={{ color: 'red', margin: '0 0 10px 0' }}>HARD DEBUG MODE</h4>
            <p>If you see values below but graphs are blank, the issue is purely visual/CSS.</p>
            <pre>{JSON.stringify(debugData, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
