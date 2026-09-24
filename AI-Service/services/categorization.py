import numpy as np
import re
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import FeatureUnion


# we are using TF_IDF + LinearSVC model for transaction categorization
# CONFIG
TRAINING_FILE = "data/transactions_training.csv"

# HIGH-CONFIDENCE MERCHANT / KEYWORD RULES
MERCHANT_RULES = {
    # Restaurants / Food
    "swiggy": "Restaurants",
    "zomato": "Restaurants",
    "eatsure": "Restaurants",
    "dominos": "Restaurants",
    "pizza hut": "Restaurants",
    "mcdonald": "Restaurants",
    "mcdonalds": "Restaurants",
    "kfc": "Restaurants",
    "burger king": "Restaurants",
    "subway": "Restaurants",
    "starbucks": "Restaurants",

    # Groceries
    "blinkit": "Groceries",
    "zepto": "Groceries",
    "bigbasket": "Groceries",
    "dmart": "Groceries",
    "jiomart": "Groceries",
    "instamart": "Groceries",
    "more supermarket": "Groceries",
    "reliance fresh": "Groceries",
    "kirana" : "Groceries",

    # Shopping
    "amazon": "Shopping",
    "flipkart": "Shopping",
    "myntra": "Shopping",
    "meesho": "Shopping",
    "ajio": "Shopping",
    "ebay": "Shopping",
    "walmart": "Shopping",
    "target": "Shopping",
    "best buy": "Shopping",
    "google pixel" :"Shopping",

    # Transportation
    "uber": "Transportation",
    "ola": "Transportation",
    "rapido": "Transportation",
    "namma yatri": "Transportation",
    "dmrc": "Transportation",
    "metro": "Transportation",
    "metro ticket": "Transportation",
    "delhi metro": "Transportation",
    "shell": "Transportation",
    "exxon": "Transportation",
    "chevron": "Transportation",

    # Travel
    "irctc": "Travel",
    "makemytrip": "Travel",
    "make my trip": "Travel",
    "goibibo": "Travel",
    "oyo": "Travel",
    "airbnb": "Travel",
    "cleartrip": "Travel",
    "booking.com": "Travel",
    "delta": "Travel",
    "united airlines": "Travel",
    "american airlines": "Travel",

    # Entertainment
    "bookmyshow": "Entertainment",
    "pvr": "Entertainment",
    "inox": "Entertainment",
    "spotify": "Subscription",
    "netflix": "Subscription",
    "hotstar": "Subscription",
    "disney+": "Subscription",
    "hulu": "Subscription",

    # Utilities
    "airtel": "Utilities",
    "jio": "Utilities",
    "reliance jio": "Utilities",
    "vodafone": "Utilities",
    "vi": "Utilities",
    "bsnl": "Utilities",
    "bescom": "Utilities",
    "electricity": "Utilities",
    "electricity bill": "Utilities",
    "water bill": "Utilities",
    "gas bill": "Utilities",
    "broadband": "Utilities",
    "internet bill": "Utilities",
    "tpddl" : "Utilities",
    "tata power" :"Utilities",

    # Healthcare
    "1mg": "Healthcare",
    "tata 1mg": "Healthcare",
    "pharmeasy": "Healthcare",
    "netmeds": "Healthcare",
    "apollo pharmacy": "Healthcare",
    "apollo hospital": "Healthcare",
    "medplus": "Healthcare",
    "cvs": "Healthcare",
    "walgreens": "Healthcare",

    # Personal Care
    "planet fitness": "Personal Care",
    "salon": "Personal Care",
    "barber": "Personal Care",
    "spa": "Personal Care",

    # Investment
    "zerodha": "Investment",
    "groww": "Investment",
    "upstox": "Investment",
    "angel one": "Investment",
    "angelone": "Investment",
    "mutual fund": "Investment",
    "mutual funds": "Investment",
    "sip": "Investment",
    "nps": "Investment",
    "ppf": "Investment",

    # EMI / Loans
    "emi": "EMI",
    "loan emi": "EMI",
    "home loan": "EMI",
    "car loan": "EMI",
    "personal loan": "EMI",
    "credit card emi": "EMI",

    
}

# TEXT NORMALIZATION

def normalize_description(description):
    """
    Normalize transaction descriptions so that variations such as:

        [DEBIT] Swiggy Order 123456
        POS SWIGGY
        Payment to SWIGGY

    become easier for the ML model to understand.
    """

    if description is None:
        return ""

    text = str(description).lower().strip()

    if not text or text == "nan":
        return ""

    # Remove common transaction prefixes
    prefixes = [
        r"\[debit\]",
        r"\[credit\]",
        r"pos\s*",
        r"ach\s*",
        r"purchase\s*",
        r"preapproved\s*payment\s*",
        r"bill\s*payment\s*",
        r"card\s*purchase\s*",
        r"online\s*payment\s*",
        r"payment\s*",
    ]

    for pattern in prefixes:
        text = re.sub(pattern, "", text)

    # Remove common payment-provider prefixes
    text = re.sub(
        r"\b(pp\*|sq\s*\*|tst\*)",
        "",
        text
    )

    # Remove long reference numbers
    text = re.sub(r"\b\d{4,}\b", " ", text)

    # Keep letters, numbers and useful symbols
    text = re.sub(
        r"[^a-z0-9+&'\s]",
        " ",
        text
    )

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text

# MERCHANT RULE LOOKUP

def find_known_merchant(description):
    """
    Look for high-confidence merchants / keywords.
    """

    normalized = normalize_description(description)

    if not normalized:
        return None

    # Longest / most specific rules first
    sorted_rules = sorted(
        MERCHANT_RULES.items(),
        key=lambda item: len(item[0]),
        reverse=True
    )

    #fix the merchant rule matching first
    for merchant, category in sorted_rules:
        pattern = rf"(?<!\w){re.escape(merchant)}(?!\w)"

        if re.search(pattern, normalized):
            return category
    return None

# MODEL TRAINING

def train_model():

    print("Loading training dataset...")

    df = pd.read_csv(TRAINING_FILE)

    # Clean descriptions
    df["description"] = (
        df["description"]
        .fillna("")
        .astype(str)
        .apply(normalize_description)
    )

    # Clean categories
    df["category"] = (
        df["category"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    # Remove unusable rows
    df = df[
        (df["description"] != "") &
        (df["category"] != "")
    ]

    X = df["description"]
    y = df["category"]

    # WORD FEATUREs

    word_vectorizer = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True
    )

    # CHARACTER FEATURES
    # Useful for:
    #   swiggy
    #   swiggyfood
    #   ubertrip
    #   zomatoorder
    # etc.

    char_vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        min_df=2,
        sublinear_tf=True
    )

    vectorizer = FeatureUnion([
        ("word", word_vectorizer),
        ("char", char_vectorizer),
    ])

    print("Creating TF-IDF features...")

    X_tfidf = vectorizer.fit_transform(X)

    # CLASSIFIER

    model = LinearSVC(
        C=2.0
    )

    model.fit(X_tfidf, y)

    print()
    print(f"Model trained on {len(df)} transactions")
    print(f"Number of categories: {len(y.unique())}")
    print(f"Categories: {sorted(y.unique())}")
    print()

    return vectorizer, model


# Train model when service starts
vectorizer, model = train_model()

# SINGLE TRANSACTION CATEGORIZATION

def categorize_transaction_with_confidence(description):

    # Empty description
    if not description or str(description).lower().strip() == "nan":
       return {
            "category": "Other",
            "confidence": 0.0
        }
    # High-confidence merchant rule

    merchant_category = find_known_merchant(description)

    if merchant_category:
        return {
            "category": merchant_category,
            "confidence": 1.0
        }

    # 2. ML MODEL

    normalized = normalize_description(description)

    if not normalized:
        return {
            "category": "Other",
            "confidence": 0.0
        }

    text_vector = vectorizer.transform([normalized])
    scores = np.asarray(model.decision_function(text_vector)).ravel()

    # Get predicted category
    prediction = model.predict(text_vector)[0]

    # LinearSVC score interpretation:
    # higher score = stronger classification

    if len(scores) >= 2:
        sorted_scores = np.sort(scores)[::-1]
        margin = sorted_scores[0] - sorted_scores[1]
        confidence = float(np.clip(margin / 2.0, 0.0, 1.0))
    else:
        confidence = 0.5

    return {
        "category": prediction,
        "confidence": round(float(confidence), 3)
    }

def categorize_transaction(description):
    result = categorize_transaction_with_confidence(description)
    return result["category"]

# DATAFRAME CATEGORIZATION

def categorize_transactions(df):

    df = df.copy()

    results = df["description"].apply(
        categorize_transaction_with_confidence
    )

    df["category"] = results.apply(
        lambda x: x["category"]
    )

    df["confidence"] = results.apply(
        lambda x: x["confidence"]
    )

    return df