import sqlite3
from theme_analyzer import ThemeAnalyzer
import sys

def reanalyze():
    db_name = "spotify_trends.db"
    analyzer = ThemeAnalyzer()
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    cursor.execute("SELECT id, chart_date FROM weeks ORDER BY chart_date")
    weeks = cursor.fetchall()
    
    print(f"Re-analyzing {len(weeks)} weeks with full logging...")

    for week_id, date_str in weeks:
        cursor.execute("SELECT lyrics FROM songs WHERE week_id = ? AND lyrics IS NOT NULL", (week_id,))
        lyrics_list = [row[0] for row in cursor.fetchall()]
        
        if lyrics_list:
            scores = analyzer.analyze_week(week_id, lyrics_list, conn=conn)
            if scores:
                kd = scores.get('Keyword Density', 'MISSING')
                tc = scores.get('Topic Clarity', 'MISSING')
                print(f"  Processed {date_str}: KD={kd}, TC={tc}")
            else:
                print(f"  Failed {date_str}")
        
    conn.commit()
    conn.close()
    print("\n✅ Re-analysis complete!")

if __name__ == "__main__":
    reanalyze()
