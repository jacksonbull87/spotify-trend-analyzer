import os
import requests
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from lyricsgenius import Genius
from dotenv import load_dotenv

load_dotenv()

def test_spotify():
    print("\n--- Testing Spotify API ---")
    client_id = os.getenv('SPOTIPY_CLIENT_ID')
    client_secret = os.getenv('SPOTIPY_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        print("❌ Error: Spotify credentials missing in .env")
        return

    try:
        auth_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
        # Force a token fetch
        token = auth_manager.get_access_token(as_dict=False)
        if token:
            print("✅ Spotify Token obtained successfully.")
        
        sp = spotipy.Spotify(auth_manager=auth_manager)
        results = sp.search(q='Taylor Swift', type='artist', limit=1)
        if results:
            print("✅ Spotify Search successful.")
    except Exception as e:
        print(f"❌ Spotify Error: {e}")
        if "403" in str(e):
            print("👉 Diagnosis: This is likely a 'Development Mode' issue.")
            print("   Action: In Spotify Dashboard -> App -> Settings -> User Management, add your account email.")

def test_genius():
    print("\n--- Testing Genius API ---")
    token = os.getenv('GENIUS_ACCESS_TOKEN')
    
    if not token or "your_genius_token" in token:
        print("❌ Error: Genius token missing in .env")
        return

    print(f"Token starts with: {token[:5]}...")
    
    try:
        genius = Genius(token)
        # Simple test
        song = genius.search_song("Hello", "Adele")
        if song:
            print("✅ Genius Search successful.")
    except Exception as e:
        print(f"❌ Genius Error: {e}")
        if "401" in str(e):
            print("👉 Diagnosis: Your Genius token is invalid (401 Unauthorized).")
            print("   Action: In Genius Dashboard -> API Clients, copy the 'CLIENT ACCESS TOKEN'.")

if __name__ == "__main__":
    test_spotify()
    test_genius()
