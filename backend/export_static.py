import sqlite3
import json
import os

def export_data():
    db_path = 'spotify_trends.db'
    output_path = '../frontend/public/data.json'
    
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Export Weeks
    cursor.execute("SELECT id, chart_date FROM weeks ORDER BY chart_date DESC")
    weeks = [{"id": row[0], "date": row[1]} for row in cursor.fetchall()]

    # 2. Export Trends
    cursor.execute('''SELECT t.name, w.chart_date, t.score 
                      FROM themes t 
                      JOIN weeks w ON t.week_id = w.id 
                      ORDER BY w.chart_date ASC''')
    rows = cursor.fetchall()
    trends_map = {}
    for theme_name, chart_date, score in rows:
        if chart_date not in trends_map:
            trends_map[chart_date] = {"date": chart_date}
        trends_map[chart_date][theme_name] = round(score, 2)
    trends = list(trends_map.values())

    # 3. Export all songs grouped by week_id for easy lookup
    cursor.execute("SELECT week_id, rank, title, artist FROM songs ORDER BY week_id, rank ASC")
    songs_rows = cursor.fetchall()
    songs_by_week = {}
    for week_id, rank, title, artist in songs_rows:
        if week_id not in songs_by_week:
            songs_by_week[week_id] = []
        songs_by_week[week_id].append({"rank": rank, "title": title, "artist": artist})

    # 4. Export all themes grouped by week_id
    cursor.execute("SELECT week_id, name, score FROM themes ORDER BY week_id, score DESC")
    themes_rows = cursor.fetchall()
    themes_by_week = {}
    for week_id, name, score in themes_rows:
        if week_id not in themes_by_week:
            themes_by_week[week_id] = []
        themes_by_week[week_id].append({"name": name, "score": round(score, 2)})

    final_data = {
        "weeks": weeks,
        "trends": trends,
        "songs_by_week": songs_by_week,
        "themes_by_week": themes_by_week
    }

    with open(output_path, 'w') as f:
        json.dump(final_data, f, indent=2)
    
    conn.close()
    print(f"✅ Data exported successfully to {output_path}")

if __name__ == "__main__":
    export_data()
