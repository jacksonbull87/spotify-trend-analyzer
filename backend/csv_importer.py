import os
import sqlite3
import pandas as pd
import time
from lyrics_client import GeniusLyricsClient
from theme_analyzer import ThemeAnalyzer

def import_csv_data(csv_path='../US_SPOTIFY WEEKLY_CHART.csv'):
    db_name = "spotify_trends.db"
    analyzer = ThemeAnalyzer()
    
    try:
        genius = GeniusLyricsClient()
    except Exception as e:
        print(f"Initialization Error: {e}")
        return

    # 1. Read CSV to get the list of dates and tracks
    print(f"Reading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    # Ensure TRACK and ARTIST are strings and handle potential NaNs
    df['TRACK'] = df['TRACK'].fillna('Unknown').astype(str)
    df['ARTIST'] = df['ARTIST'].fillna('Unknown').astype(str)
    
    dates = sorted(df['P_DAY'].unique())
    print(f"Found {len(dates)} unique dates.")

    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    # 2. Get existing lyrics from DB to avoid re-fetching
    cursor.execute("SELECT title, artist, lyrics FROM songs WHERE lyrics IS NOT NULL")
    lyrics_db_cache = {f"{row[0]} - {row[1]}".lower(): row[2] for row in cursor.fetchall()}
    print(f"Loaded {len(lyrics_db_cache)} songs from local cache.")

    # 3. Clear existing data for a fresh analysis from the CSV
    print("Clearing old analysis data...")
    cursor.execute("DELETE FROM themes")
    cursor.execute("DELETE FROM weeks")
    cursor.execute("DELETE FROM songs")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('themes', 'weeks', 'songs')")
    conn.commit()

    # 4. For each date, construct a Top 10 from the CSV
    for date_str in dates:
        # Insert Week
        cursor.execute("INSERT INTO weeks (chart_date) VALUES (?)", (date_str,))
        week_id = cursor.lastrowid
        
        # Get songs for this date from the CSV
        csv_week_songs = df[df['P_DAY'] == date_str].sort_values('RANK_ORDER')
        week_songs = []
        seen_keys = set()
        
        for _, row in csv_week_songs.iterrows():
            if len(week_songs) >= 10: break
            title, artist = row['TRACK'], row['ARTIST']
            key = f"{title} - {artist}".lower()
            if key not in seen_keys:
                week_songs.append({"title": title, "artist": artist})
                seen_keys.add(key)
        
        # Save songs and collect lyrics
        week_lyrics = []
        for i, song in enumerate(week_songs, 1):
            key = f"{song['title']} - {song['artist']}".lower()
            lyrics = None
            
            if key in lyrics_db_cache:
                lyrics = lyrics_db_cache[key]
            else:
                print(f"    Fetching lyrics: {song['title']}...")
                try:
                    lyrics = genius.get_lyrics(song['title'], song['artist'])
                    if lyrics:
                        lyrics_db_cache[key] = lyrics
                    time.sleep(1.0)
                except Exception as e:
                    print(f"      Error: {e}")
                    time.sleep(5)
            
            cursor.execute("INSERT INTO songs (week_id, rank, title, artist, lyrics) VALUES (?, ?, ?, ?, ?)",
                           (week_id, i, song['title'], song['artist'], lyrics))
            if lyrics:
                week_lyrics.append(lyrics)
        
        if week_lyrics:
            analyzer.analyze_week(week_id, week_lyrics, conn=conn)
        
        conn.commit()
        print(f"  {date_str} - OK ({len(week_lyrics)} lyrics)")

    conn.close()
    print("\n✅ CSV Data Import and Analysis Complete!")

if __name__ == "__main__":
    import_csv_data()
