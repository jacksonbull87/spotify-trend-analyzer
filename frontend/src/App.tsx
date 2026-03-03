import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Calendar, Music, BarChart3, ChevronRight } from 'lucide-react';

const COLORS = ['#1DB954', '#8E44AD', '#3498DB', '#E67E22', '#E74C3C', '#F1C40F'];

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const App = () => {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [songs, setSongs] = useState([]);
  const [themes, setThemes] = useState([]);
  const [trends, setTrends] = useState([]);

  const [allStaticData, setAllStaticData] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Try to fetch from the local API first if available
      let weeksData, trendsData;
      try {
        const weeksRes = await axios.get(`${API_BASE_URL}/api/weeks`);
        weeksData = weeksRes.data;
        const trendsRes = await axios.get(`${API_BASE_URL}/api/trends`);
        trendsData = trendsRes.data;
      } catch (e) {
        // 2. Fallback to static data.json (for Netlify/Static Hosting)
        console.log("Live API not found, falling back to static data.json");
        const staticRes = await axios.get('/data.json');
        setAllStaticData(staticRes.data);
        weeksData = staticRes.data.weeks;
        trendsData = staticRes.data.trends;
      }

      setWeeks(weeksData);
      if (weeksData.length > 0) {
        setSelectedWeek(weeksData[0]);
      }
      
      // Apply 5-period moving average smoothing
      const rawData = trendsData;
      const smoothed = rawData.map((entry, index, array) => {
        const start = Math.max(0, index - 2);
        const end = Math.min(array.length, index + 3);
        const window = array.slice(start, end);
        
        const smoothedEntry = { ...entry };
        Object.keys(entry).forEach(key => {
          if (key !== 'date') {
            const avg = window.reduce((acc, curr) => acc + (curr[key] || 0), 0) / window.length;
            smoothedEntry[key] = parseFloat(avg.toFixed(3));
          }
        });
        return smoothedEntry;
      });
      
      setTrends(smoothed);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    if (selectedWeek) {
      fetchWeekData(selectedWeek.id);
    }
  }, [selectedWeek]);

  const fetchWeekData = async (weekId) => {
    try {
      // 1. Try Live API
      try {
        const themesRes = await axios.get(`${API_BASE_URL}/api/week/${weekId}/themes`);
        setThemes(themesRes.data);
        const songsRes = await axios.get(`${API_BASE_URL}/api/week/${weekId}/songs`);
        setSongs(songsRes.data);
      } catch (e) {
        // 2. Fallback to cached static data
        if (allStaticData) {
          setThemes(allStaticData.themes_by_week[weekId] || []);
          setSongs(allStaticData.songs_by_week[weekId] || []);
        } else {
          // If we haven't loaded static data yet, fetch it
          const staticRes = await axios.get('/data.json');
          setAllStaticData(staticRes.data);
          setThemes(staticRes.data.themes_by_week[weekId] || []);
          setSongs(staticRes.data.songs_by_week[weekId] || []);
        }
      }
    } catch (err) {
      console.error("Error fetching week data:", err);
    }
  };

  const themeKeys = trends.length > 0 ? Object.keys(trends[0]).filter(k => k !== 'date') : [];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#1DB954', fontSize: '2.5rem' }}>
          <TrendingUp size={40} />
          Spotify Cultural Trend Analyzer
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Analyzing top charts to track the heartbeat of culture.</p>
        
        <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px', marginTop: '20px', fontSize: '1rem', lineHeight: '1.6', color: '#ccc', border: '1px solid #333' }}>
          <div style={{ marginBottom: '25px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
            <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1.4rem' }}>The Mission</h3>
            <p style={{ fontSize: '1.1rem', color: '#fff' }}>
              Music is the ultimate mirror of society. This tool aims to quantify the <strong>evolution of our collective consciousness</strong> by algorithmically dissecting the themes that dominate the airwaves. By tracking these shifts over years, we can visualize how our values, anxieties, and celebrations transform in real-time.
            </p>
          </div>

          <h3 style={{ marginTop: 0, color: '#1DB954' }}>How it Works</h3>
          <p>
            This application tracks cultural shifts by analyzing the lyrics of the most popular songs on Spotify from 2020 to 2026.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <strong style={{ color: '#fff' }}>1. Data Sourcing</strong><br/>
              Weekly Top 200 charts are pulled via the <strong>Spotify Web API</strong>.
            </div>
            <div>
              <strong style={{ color: '#fff' }}>2. Lyric Extraction</strong><br/>
              Full song lyrics are retrieved using the <strong>Genius API</strong> for every charting track.
            </div>
            <div>
              <strong style={{ color: '#fff' }}>3. NLP Analysis</strong><br/>
              Using <strong>Natural Language Processing (NLTK)</strong>, we categorize lyrics into cultural themes (e.g., Romance, Resilience, Melancholy) based on keyword prominence and sentiment.
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '40px' }}>
        {/* Main Theme Trends */}
        <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
            <BarChart3 size={24} /> Cultural Theme Evolution
          </h2>
          <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.95rem' }}>
            This chart tracks how the "mood" of the country has shifted. By following these lines, you can see when society leaned into Romance, sought Resilience during tough times, or embraced Melancholy. It visualizes the rise and fall of our collective emotional priorities.
          </p>
          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  stroke="#888" 
                  tick={{ fontSize: 12 }} 
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                <Legend />
                {themeKeys.filter(k => !['Optimism Index', 'Keyword Density', 'Topic Clarity'].includes(k)).map((key, index) => (
                  <Line key={key} type="basis" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          {/* Optimism Index */}
          <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1rem' }}>Optimism Index</h3>
            <div style={{ height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <Line type="basis" dataKey="Optimism Index" stroke="#F1C40F" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ display: 'none' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#888' }}><strong>The "Mood" Score:</strong> Higher points mean songs were generally more positive and upbeat, while lower points suggest a more serious or somber musical landscape.</p>
          </section>

          {/* Keyword Density */}
          <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1rem' }}>Lyrical Focus</h3>
            <div style={{ height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <Line type="basis" dataKey="Keyword Density" stroke="#E67E22" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ display: 'none' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#888' }}><strong>The "Directness" Score:</strong> High scores mean songs used clear, repetitive keywords about their themes. Low scores mean more abstract or unique songwriting.</p>
          </section>

          {/* Topic Clarity */}
          <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, color: '#1DB954', fontSize: '1rem' }}>Topic Consistency</h3>
            <div style={{ height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <Line type="basis" dataKey="Topic Clarity" stroke="#3498DB" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ display: 'none' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#888' }}><strong>The "Unity" Score:</strong> High scores mean all top hits were singing about the same core subject. Low scores suggest a more fragmented cultural moment.</p>
          </section>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        {/* Weekly Themes Breakdown */}
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
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '15px' }}>
            A deep-dive into the specific emotional makeup of the Top 10 songs for this week.
          </p>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={themes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" />
                <YAxis dataKey="name" type="category" stroke="#888" width={100} />
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
            <div key={song.rank} style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1DB954', minWidth: '30px' }}>{song.rank}</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>{song.title}</div>
                <div style={{ color: '#888', fontSize: '0.9rem' }}>{song.artist}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#555', fontSize: '0.9rem' }}>
        <p>Built with Gemini CLI & FastAPI & React</p>
      </footer>
    </div>
  );
};

export default App;
