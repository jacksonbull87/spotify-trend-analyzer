import sqlite3
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict

app = FastAPI(title="Spotify Cultural Trend Analyzer")

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_NAME = "spotify_trends.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''CREATE TABLE IF NOT EXISTS weeks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        chart_date TEXT UNIQUE)''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS songs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        week_id INTEGER,
                        rank INTEGER,
                        title TEXT,
                        artist TEXT,
                        lyrics TEXT,
                        FOREIGN KEY (week_id) REFERENCES weeks (id))''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS themes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        week_id INTEGER,
                        name TEXT,
                        score REAL,
                        FOREIGN KEY (week_id) REFERENCES weeks (id))''')
    
    # Check if data already exists (both mock and potentially real)
    cursor.execute("SELECT COUNT(*) FROM weeks")
    count = cursor.fetchone()[0]
    if count == 0:
        print("Database initialized. Use scrape.py or historical_importer.py to add data.")
    
    conn.commit()
    conn.close()

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/api/weeks")
async def get_weeks():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, chart_date FROM weeks ORDER BY chart_date DESC")
    weeks = [{"id": row[0], "date": row[1]} for row in cursor.fetchall()]
    conn.close()
    return weeks

@app.get("/api/week/{week_id}/themes")
async def get_week_themes(week_id: int):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT name, score FROM themes WHERE week_id = ? ORDER BY score DESC", (week_id,))
    themes = [{"name": row[0], "score": round(row[1], 2)} for row in cursor.fetchall()]
    conn.close()
    return themes

@app.get("/api/week/{week_id}/songs")
async def get_week_songs(week_id: int):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT rank, title, artist FROM songs WHERE week_id = ? ORDER BY rank ASC LIMIT 10", (week_id,))
    songs = [{"rank": row[0], "title": row[1], "artist": row[2]} for row in cursor.fetchall()]
    conn.close()
    return songs

@app.get("/api/trends")
async def get_trends():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Get all themes and their scores over time
    cursor.execute('''SELECT t.name, w.chart_date, t.score 
                      FROM themes t 
                      JOIN weeks w ON t.week_id = w.id 
                      ORDER BY w.chart_date ASC''')
    rows = cursor.fetchall()
    conn.close()
    
    # Restructure for visualization: [{date: '2025-01-01', Theme1: 0.5, Theme2: 0.8}, ...]
    trends_map = {}
    for theme_name, chart_date, score in rows:
        if chart_date not in trends_map:
            trends_map[chart_date] = {"date": chart_date}
        trends_map[chart_date][theme_name] = round(score, 2)
    
    return list(trends_map.values())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
