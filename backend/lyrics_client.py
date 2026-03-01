import os
import lyricsgenius
from dotenv import load_dotenv

load_dotenv()

class GeniusLyricsClient:
    def __init__(self):
        token = os.getenv('GENIUS_ACCESS_TOKEN')
        if not token or token == 'your_genius_token_here' or token == '':
            raise ValueError("Genius Access Token is missing or not configured in .env")
        
        # Ensure token is stripped of any quotes if they were added accidentally
        token = token.strip("'").strip('"')
        
        self.genius = lyricsgenius.Genius(token)
        self.genius.remove_section_headers = True
        self.genius.verbose = True # Enable verbose output to see API calls

    def get_lyrics(self, title, artist):
        """Search for a song and return its lyrics"""
        try:
            song = self.genius.search_song(title, artist)
            if song:
                return song.lyrics
            return None
        except Exception as e:
            print(f"Error fetching lyrics for {title} by {artist}: {e}")
            return None

# Example Usage:
# client = GeniusLyricsClient()
# lyrics = client.get_lyrics("Cruel Summer", "Taylor Swift")
# print(lyrics[:200])
