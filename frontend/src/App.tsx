import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Calendar, Music, BarChart3, RefreshCw, Loader2, Database } from 'lucide-react';

const COLORS = ['#1DB954', '#8E44AD', '#3498DB', '#E67E22', '#E74C3C', '#F1C40F'];
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const App = () => {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [songs, setSongs] = useState([]);
  const [themes, setThemes] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const resT = await axios.get(`${API_BASE_URL}/api/trends`);
        if (!Array.isArray(resT.data) || resT.data.length === 0) throw new Error();
        
        // Validation: If all optimism values are 0, the API is likely unpopulated
        const hasData = resT.data.some(d => (d.Optimism_Index || d["Optimism Index"] || 0) > 0);
        if (!hasData) throw new Error("API metrics empty");

        wData = resW.data;
        tData = resT.data;
      } catch (e) {
        const resS = await axios.get(`/data.json?t=${Date.now()}`);
        wData = resS.data.weeks;
        tData = resS.data.trends;
        source = 'File';
      }

      const mapped = tData.map(d => ({
        ...d,
        opt: Number(d.Optimism_Index || d["Optimism Index"] || 0),
        foc: Number(d.Keyword_Density || d["Keyword Density"] || 0),
        con: Number(d.Topic_Clarity || d["Topic Clarity"] || 0)
      }));

      // Calculate Min/Max for Debug
      const getRange = (key) => {
        const vals = mapped.map(m => m[key]).filter(v => v > 0);
        return vals.length ? `${Math.min(...vals).toFixed(2)} - ${Math.max(...vals).toFixed(2)}` : '0';
      };

      setStats({
        opt: getRange('opt'),
        foc: getRange('foc'),
        con: getRange('con'),
        source: source
      });

      setWeeks(wData);
      setSelectedWeek(wData[0]);
      setTrends(mapped);
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
        } catch (e) {}
      };
      fetchDetails();
    }
  }, [selectedWeek]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff', backgroundColor: '#121212', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#1DB954', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem' }}><TrendingUp /> Cultural Trends</h1>
          <p style={{ color: '#666', fontSize: '0.8rem', margin: '5px 0 0 0' }}>Data Source: {stats.source}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ padding: '5px 10px', backgroundColor: '#1a1a1a', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid #333', color: '#888' }}>
            Ranges: Opt({stats.opt}) • Foc({stats.foc}) • Con({stats.con})
          </div>
          <button onClick={() => window.location.reload()} style={{ backgroundColor: '#222', color: '#888', border: '1px solid #444', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem' }}>
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 className="animate-spin" size={40} color="#1DB954" /></div>
      ) : (
        <>
          <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #222' }}>
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 20px 0' }}>Theme Evolution</h2>
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
              { label: 'Optimism Index', k: 'opt', color: '#F1C40F' },
              { label: 'Lyrical Focus', k: 'foc', color: '#E67E22' },
              { label: 'Topic Consistency', k: 'con', color: '#3498DB' }
            ].map(m => (
              <div key={m.k} style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ fontSize: '0.85rem', color: '#1DB954', marginBottom: '10px' }}>{m.label}</h3>
                <div style={{ height: '140px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      {/* ZOOMED Y-AXIS: dataMin/Max forces the line to fill the container */}
                      <YAxis domain={['dataMin', 'dataMax']} stroke="#444" tick={{fontSize: 8}} width={35} />
                      <XAxis dataKey="date" hide />
                      <Tooltip contentStyle={{backgroundColor: '#1e1e1e', fontSize: '10px'}} />
                      <Line type="monotone" dataKey={m.k} stroke={m.color} strokeWidth={3} dot={false} isAnimationActive={false} />
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
                <select onChange={e => setSelectedWeek(weeks.find(w => String(w.id) === e.target.value))} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.8rem' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {songs.slice(0, 5).map(s => (
                  <div key={`${s.rank}-${s.title}`} style={{ padding: '8px', borderBottom: '1px solid #222', fontSize: '0.8rem', display: 'flex', gap: '15px' }}>
                    <span style={{ color: '#1DB954', fontWeight: 'bold' }}>{s.rank}</span>
                    <span>{s.title}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
