import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv

load_dotenv()

class SpotifyChartClient:
    def __init__(self):
        auth_manager = SpotifyClientCredentials(
            client_id=os.getenv('SPOTIPY_CLIENT_ID'),
            client_secret=os.getenv('SPOTIPY_CLIENT_SECRET')
        )
        self.sp = spotipy.Spotify(auth_manager=auth_manager)

    def get_top_tracks_fallback(self):
        """Fallback: Search for currently popular tracks since Playlists are restricted"""
        print("Playlist API restricted. Falling back to Search API for popular tracks...")
        # Simpler query that is less likely to cause a 400
        results = self.sp.search(q='year:2024-2025', type='track', limit=10)
        
        chart_data = []
        if results and 'tracks' in results and 'items' in results['tracks']:
            for i, track in enumerate(results['tracks']['items'], 1):
                chart_data.append({
                    "rank": i,
                    "title": track['name'],
                    "artist": track['artists'][0]['name'],
                    "spotify_id": track['id']
                })
        return chart_data

    def get_playlist_tracks(self, playlist_id):
        """Try playlist first, fallback to search if forbidden"""
        try:
            # We use a smaller limit for dev accounts
            results = self.sp.playlist_items(playlist_id, limit=50)
            tracks = results['items']
            chart_data = []
            for i, item in enumerate(tracks, 1):
                track = item.get('track')
                if track:
                    chart_data.append({
                        "rank": i, 
                        "title": track.get('name'), 
                        "artist": track['artists'][0]['name'] if track['artists'] else "Unknown", 
                        "spotify_id": track.get('id')
                    })
            return chart_data
        except Exception as e:
            if "403" in str(e):
                return self.get_top_tracks_fallback()
            print(f"Error fetching playlist: {e}")
            return []
