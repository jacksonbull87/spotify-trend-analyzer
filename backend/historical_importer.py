import sqlite3
import time
from datetime import datetime
from theme_analyzer import ThemeAnalyzer
from lyrics_client import GeniusLyricsClient

HISTORICAL_DATA = {
    "2020-01-01": [("The Box", "Roddy Ricch"), ("Life Is Good", "Future"), ("Circles", "Post Malone"), ("Memories", "Maroon 5"), ("Someone You Loved", "Lewis Capaldi")],
    "2020-07-01": [("Rockstar", "DaBaby"), ("Blinding Lights", "The Weeknd"), ("Whats Poppin", "Jack Harlow"), ("Savage Love", "Jawsh 685"), ("Watermelon Sugar", "Harry Styles")],
    "2021-01-01": [("Mood", "24kGoldn"), ("Positions", "Ariana Grande"), ("Blinding Lights", "The Weeknd"), ("Holy", "Justin Bieber"), ("Go Crazy", "Chris Brown")],
    "2021-07-01": [("Butter", "BTS"), ("Good 4 U", "Olivia Rodrigo"), ("Kiss Me More", "Doja Cat"), ("Levitating", "Dua Lipa"), ("Bad Habits", "Ed Sheeran")],
    "2022-01-01": [("Easy On Me", "Adele"), ("Stay", "The Kid LAROI"), ("Heat Waves", "Glass Animals"), ("Shivers", "Ed Sheeran"), ("Cold Heart", "Elton John")],
    "2022-07-01": [("As It Was", "Harry Styles"), ("First Class", "Jack Harlow"), ("About Damn Time", "Lizzo"), ("Running Up That Hill", "Kate Bush"), ("Wait For U", "Future")],
    "2023-01-01": [("Kill Bill", "SZA"), ("Anti-Hero", "Taylor Swift"), ("Unholy", "Sam Smith"), ("Rich Flex", "Drake"), ("Cuff It", "Beyoncé")],
    "2023-07-01": [("Last Night", "Morgan Wallen"), ("Fast Car", "Luke Combs"), ("Vampire", "Olivia Rodrigo"), ("Cruel Summer", "Taylor Swift"), ("Flowers", "Miley Cyrus")],
    "2024-01-01": [("Lovin On Me", "Jack Harlow"), ("Cruel Summer", "Taylor Swift"), ("Greedy", "Tate McRae"), ("Paint The Town Red", "Doja Cat"), ("Snooze", "SZA")],
    "2024-07-01": [("Not Like Us", "Kendrick Lamar"), ("A Bar Song (Tipsy)", "Shaboozey"), ("Espresso", "Sabrina Carpenter"), ("Million Dollar Baby", "Tommy Richman"), ("Please Please Please", "Sabrina Carpenter")],
    "2025-01-01": [("APT.", "ROSÉ"), ("Die With A Smile", "Lady Gaga"), ("Birds of a Feather", "Billie Eilish"), ("Love Somebody", "Morgan Wallen"), ("That's So True", "Gracie Abrams")]
}

def import_history():
    db_name = "spotify_trends.db"
    analyzer = ThemeAnalyzer()
    
    try:
        genius = GeniusLyricsClient()
    except Exception as e:
        print(f"Genius not configured: {e}")
        return

    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    print(f"Starting historical import for {len(HISTORICAL_DATA)} periods...")

    for date_str, songs in HISTORICAL_DATA.items():
        print(f"\n--- Processing {date_str} ---")
        
        try:
            cursor.execute("INSERT INTO weeks (chart_date) VALUES (?)", (date_str,))
            week_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            cursor.execute("SELECT id FROM weeks WHERE chart_date = ?", (date_str,))
            week_id = cursor.fetchone()[0]

        current_week_lyrics = []
        cursor.execute("DELETE FROM songs WHERE week_id = ?", (week_id,))
        
        for rank, (title, artist) in enumerate(songs, 1):
            cursor.execute("INSERT INTO songs (week_id, rank, title, artist) VALUES (?, ?, ?, ?)",
                           (week_id, rank, title, artist))
            
            print(f"  Fetching lyrics: {title} by {artist}...")
            lyrics = genius.get_lyrics(title, artist)
            if lyrics:
                current_week_lyrics.append(lyrics)
            time.sleep(1)

        if current_week_lyrics:
            print(f"  Analyzing themes for {date_str}...")
            analyzer.analyze_week(week_id, current_week_lyrics, conn=conn)
        
        conn.commit()

    conn.close()
    print("\n✅ Historical Import Complete!")

if __name__ == "__main__":
    import_history()
