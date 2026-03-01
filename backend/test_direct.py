from spotify_client import SpotifyChartClient

client = SpotifyChartClient()
# Hardcoded official Spotify Top 50 USA ID (usually 37i9dQZEVXbLRQvS0mv38L)
playlist_id = '37i9dQZEVXbLRQvS0mv38L'
print(f"Directly testing playlist ID: {playlist_id}")
songs = client.get_playlist_tracks(playlist_id)
if songs:
    print(f"Successfully fetched {len(songs)} songs!")
    for song in songs[:5]:
        print(f"{song['rank']}. {song['title']} by {song['artist']}")
else:
    print("Could not fetch playlist. There might be a permission issue or the ID is incorrect.")
