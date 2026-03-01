from lyrics_client import GeniusLyricsClient
import os

try:
    print("Testing Genius Connection...")
    client = GeniusLyricsClient()
    # Test with a popular song
    song_title = "Cruel Summer"
    artist_name = "Taylor Swift"
    print(f"Searching for: {song_title} by {artist_name}...")
    lyrics = client.get_lyrics(song_title, artist_name)
    if lyrics:
        print(f"Successfully fetched lyrics! Length: {len(lyrics)} characters.")
        print("-" * 30)
        print(f"Lyrics Preview:\n{lyrics[:300]}...")
        print("-" * 30)
    else:
        print("Could not find lyrics for the test song.")
except Exception as e:
    print(f"Error testing Genius connection: {e}")
