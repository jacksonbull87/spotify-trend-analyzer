import sqlite3
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import re

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('punkt_tab')

class ThemeAnalyzer:
    def __init__(self):
        self.db_name = "spotify_trends.db"
        self.stop_words = set(stopwords.words('english'))
        
        # Define cultural themes and their associated "seed words"
        self.themes_dictionary = {
            "Romance": ["love", "heart", "kiss", "baby", "darling", "mine", "forever", "together", "feel", "touch", "sweet", "beauty"],
            "Party/Celebration": ["dance", "club", "night", "party", "drink", "shot", "bass", "music", "floor", "celebrate", "wild", "weekend"],
            "Resilience/Success": ["rise", "win", "hustle", "money", "cash", "gold", "strong", "power", "king", "queen", "top", "work", "grind"],
            "Melancholy/Heartbreak": ["sad", "cry", "alone", "pain", "blue", "tears", "gone", "goodbye", "hurt", "dark", "lost", "broken"],
            "Social/Identity": ["world", "change", "people", "fight", "justice", "truth", "real", "soul", "life", "peace", "society", "stand"],
            "Nostalgia": ["remember", "back", "then", "old", "days", "young", "time", "memory", "years", "past", "child", "home"]
        }

    def preprocess_text(self, text):
        # Remove non-alphabetic characters and lowercase
        text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
        tokens = word_tokenize(text)
        # Remove stop words
        filtered_tokens = [w for w in tokens if w not in self.stop_words]
        return filtered_tokens

    def get_theme_scores(self, lyrics_list):
        """Aggregate scores across a list of lyrics for a whole week"""
        total_tokens = []
        for lyrics in lyrics_list:
            total_tokens.extend(self.preprocess_text(lyrics))
        
        if not total_tokens:
            return {}

        scores = {theme: 0 for theme in self.themes_dictionary}
        
        # Count occurrences of seed words
        for token in total_tokens:
            for theme, seeds in self.themes_dictionary.items():
                if token in seeds:
                    scores[theme] += 1
        
        # Normalize scores (0.0 to 1.0 based on relative prominence)
        max_score = max(scores.values()) if max(scores.values()) > 0 else 1
        normalized_scores = {theme: round(val / max_score, 2) for theme, val in scores.items()}
        
        return normalized_scores

    def analyze_week(self, week_id, lyrics_list, conn=None):
        """Analyze lyrics for a week and save to database"""
        scores = self.get_theme_scores(lyrics_list)
        if not scores:
            print(f"No lyrics to analyze for week {week_id}")
            return

        should_close = False
        if conn is None:
            conn = sqlite3.connect(self.db_name, timeout=30)
            should_close = True
            
        try:
            cursor = conn.cursor()
            # Clear existing themes for this week if any
            cursor.execute("DELETE FROM themes WHERE week_id = ?", (week_id,))
            for theme_name, score in scores.items():
                cursor.execute("INSERT INTO themes (week_id, name, score) VALUES (?, ?, ?)",
                               (week_id, theme_name, score))
            if should_close:
                conn.commit()
        finally:
            if should_close:
                conn.close()
        
        print(f"Successfully saved {len(scores)} theme scores for week {week_id}")
        return scores

if __name__ == "__main__":
    # Test with some sample data
    analyzer = ThemeAnalyzer()
    sample_lyrics = [
        "I love you baby, you have my heart forever together",
        "Let's go to the club and dance all night at the party"
    ]
    print("Test Analysis:", analyzer.get_theme_scores(sample_lyrics))
