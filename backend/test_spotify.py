from spotify_client import SpotifyChartClient
import os

try:
    print("Testing Spotify Connection...")
    client = SpotifyChartClient()
    # Fetching the 'Top 50 USA' playlist tracks
    songs = client.get_playlist_tracks('37i9dQZEVXbLRQvS0mv38L')
    print(f"Successfully fetched {len(songs)} songs!")
    print(f"Top 3:")
    for song in songs[:3]:
        print(f"{song['rank']}. {song['title']} by {song['artist']}")
except Exception as e:
    print(f"Error testing Spotify connection: {e}")
