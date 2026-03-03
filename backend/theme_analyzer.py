import sqlite3
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import re
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation

# Download necessary NLTK data
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
    nltk.data.find('sentiment/vader_lexicon')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('vader_lexicon')

class ThemeAnalyzer:
    def __init__(self):
        self.db_name = "spotify_trends.db"
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()
        self.sia = SentimentIntensityAnalyzer()
        
        # Define cultural themes with lemmatized seeds
        self.themes_dictionary = {
            "Romance": ["love", "heart", "kiss", "baby", "darling", "mine", "forever", "together", "feel", "touch", "sweet", "beauty"],
            "Party/Celebration": ["dance", "club", "night", "party", "drink", "shot", "bass", "music", "floor", "celebrate", "wild", "weekend"],
            "Resilience/Success": ["rise", "win", "hustle", "money", "cash", "gold", "strong", "power", "king", "queen", "top", "work", "grind"],
            "Melancholy": ["sad", "cry", "alone", "pain", "blue", "tears", "gone", "goodbye", "hurt", "dark", "lost", "broken"],
            "Social/Identity": ["world", "change", "people", "fight", "justice", "truth", "real", "soul", "life", "peace", "society", "stand"],
            "Nostalgia": ["remember", "back", "then", "old", "days", "young", "time", "memory", "years", "past", "child", "home"]
        }
        # Lemmatize the seeds for better matching
        for theme in self.themes_dictionary:
            self.themes_dictionary[theme] = [self.lemmatizer.lemmatize(word) for word in self.themes_dictionary[theme]]

    def preprocess_text(self, text):
        if not text: return []
        text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
        tokens = word_tokenize(text)
        filtered_tokens = [self.lemmatizer.lemmatize(w) for w in tokens if w not in self.stop_words]
        return filtered_tokens

    def get_sentiment_score(self, lyrics_list):
        if not lyrics_list: return 0.5
        compounds = []
        for lyrics in lyrics_list:
            if not lyrics: continue
            score = self.sia.polarity_scores(lyrics)
            compounds.append((score['compound'] + 1) / 2)
        return sum(compounds) / len(compounds) if compounds else 0.5

    def get_keyword_density(self, total_tokens):
        """Calculate percentage of words that match our cultural themes"""
        if not total_tokens: return 0
        all_seeds = set()
        for seeds in self.themes_dictionary.values():
            all_seeds.update(seeds)
        
        matches = [t for t in total_tokens if t in all_seeds]
        return round(len(matches) / len(total_tokens), 4)

    def get_topic_modeling(self, lyrics_list):
        """Use LDA to find the dominant latent topic weight (0.0 to 1.0)"""
        valid_lyrics = [l for l in lyrics_list if l and len(l) > 50]
        if len(valid_lyrics) < 2: return 0.5
        
        try:
            vectorizer = CountVectorizer(stop_words='english', max_features=1000)
            dtm = vectorizer.fit_transform(valid_lyrics)
            lda = LatentDirichletAllocation(n_components=1, random_state=42)
            lda.fit(dtm)
            # We use the log-likelihood as a proxy for "topic clarity" or density
            score = lda.score(dtm)
            # Normalize it loosely for visualization
            return round(abs(score) / (len(valid_lyrics) * 500), 2)
        except:
            return 0.5

    def get_theme_scores(self, lyrics_list):
        total_tokens = []
        for lyrics in lyrics_list:
            total_tokens.extend(self.preprocess_text(lyrics))
        
        if not total_tokens:
            return {}

        scores = {theme: 0 for theme in self.themes_dictionary}
        for token in total_tokens:
            for theme, seeds in self.themes_dictionary.items():
                if token in seeds:
                    scores[theme] += 1
        
        max_score = max(scores.values()) if max(scores.values()) > 0 else 1
        normalized_scores = {theme: round(val / max_score, 2) for theme, val in scores.items()}
        
        # New Metrics
        normalized_scores["Optimism Index"] = round(self.get_sentiment_score(lyrics_list), 2)
        normalized_scores["Keyword Density"] = self.get_keyword_density(total_tokens)
        normalized_scores["Topic Clarity"] = self.get_topic_modeling(lyrics_list)
        
        return normalized_scores

    def analyze_week(self, week_id, lyrics_list, conn=None):
        scores = self.get_theme_scores(lyrics_list)
        if not scores: return

        should_close = False
        if conn is None:
            conn = sqlite3.connect(self.db_name, timeout=30)
            should_close = True
            
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM themes WHERE week_id = ?", (week_id,))
            for theme_name, score in scores.items():
                cursor.execute("INSERT INTO themes (week_id, name, score) VALUES (?, ?, ?)",
                               (week_id, theme_name, score))
            if should_close:
                conn.commit()
        finally:
            if should_close:
                conn.close()
        return scores



if __name__ == "__main__":
    # Test with some sample data
    analyzer = ThemeAnalyzer()
    sample_lyrics = [
        "I love you baby, you have my heart forever together",
        "Let's go to the club and dance all night at the party"
    ]
    print("Test Analysis:", analyzer.get_theme_scores(sample_lyrics))
