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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const weeksRes = await axios.get(`${API_BASE_URL}/api/weeks`);
      setWeeks(weeksRes.data);
      if (weeksRes.data.length > 0) {
        setSelectedWeek(weeksRes.data[0]);
      }
      const trendsRes = await axios.get(`${API_BASE_URL}/api/trends`);
      setTrends(trendsRes.data);
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
      const themesRes = await axios.get(`${API_BASE_URL}/api/week/${weekId}/themes`);
      setThemes(themesRes.data);
      const songsRes = await axios.get(`${API_BASE_URL}/api/week/${weekId}/songs`);
      setSongs(songsRes.data);
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        {/* Trend Over Time */}
        <section style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '12px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
            <BarChart3 size={24} /> Historical Trends
          </h2>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                />
                <Legend />
                {themeKeys.map((key, index) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

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
