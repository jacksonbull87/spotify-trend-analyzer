import os
import sqlite3
from datetime import datetime
from spotify_client import SpotifyChartClient
from lyrics_client import GeniusLyricsClient
from theme_analyzer import ThemeAnalyzer
from dotenv import load_dotenv

load_dotenv()

class ChartScraper:
    def __init__(self):
        self.db_name = "spotify_trends.db"
        try:
            self.spotify = SpotifyChartClient()
            self.genius = GeniusLyricsClient()
            self.analyzer = ThemeAnalyzer()
        except Exception as e:
            print(f"Initialization Error: {e}")
            self.spotify = None
            self.genius = None
            self.analyzer = None

    def scrape_current_chart(self, playlist_id='37i9dQZEVXbLRQvS0mv38L'):
        if not self.spotify or not self.genius or not self.analyzer:
            print("API Clients or NLP Analyzer not properly configured. Check your .env and NLTK data.")
            return

        print(f"Fetching tracks from playlist: {playlist_id}...")
        tracks = self.spotify.get_playlist_tracks(playlist_id)
        
        if not tracks:
            print("No tracks found or permission denied.")
            return

        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        # 1. Create a new week entry
        chart_date = datetime.now().strftime("%Y-%m-%d")
        try:
            cursor.execute("INSERT INTO weeks (chart_date) VALUES (?)", (chart_date,))
            week_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            print(f"Chart for {chart_date} already exists.")
            cursor.execute("SELECT id FROM weeks WHERE chart_date = ?", (chart_date,))
            week_id = cursor.fetchone()[0]

        # 2. Save songs and fetch lyrics
        print(f"Processing top 10 songs for {chart_date}...")
        all_lyrics = []
        # Clear existing songs for this week to avoid duplicates if re-running
        cursor.execute("DELETE FROM songs WHERE week_id = ?", (week_id,))
        
        for track in tracks[:10]:
            print(f"Rank {track['rank']}: {track['title']} by {track['artist']}")
            cursor.execute('''INSERT INTO songs (week_id, rank, title, artist) 
                              VALUES (?, ?, ?, ?)''', 
                           (week_id, track['rank'], track['title'], track['artist']))
            
            lyrics = self.genius.get_lyrics(track['title'], track['artist'])
            if lyrics:
                all_lyrics.append(lyrics)
        
        conn.commit()
        conn.close()
        
        if all_lyrics:
            print(f"Analyzing {len(all_lyrics)} songs for cultural themes...")
            self.analyzer.analyze_week(week_id, all_lyrics)
            print("Scrape and Analysis COMPLETE!")
        else:
            print("No lyrics were found to analyze.")

if __name__ == "__main__":
    scraper = ChartScraper()
    # You can change this ID to any public playlist
    scraper.scrape_current_chart()
