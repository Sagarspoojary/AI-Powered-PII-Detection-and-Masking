import re
from typing import List, Dict

PII_PATTERNS = {
    "email": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    "phone": r"(?:\+91[-.\s]?)?[6-9]\d{9}|\b\d{10}\b",
    "aadhaar": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
    "dob": r"\b\d{2}[-/]\d{2}[-/]\d{4}\b",
    "pan": r"[A-Z]{5}[0-9]{4}[A-Z]{1}",
    "driving_license": r"\b[A-Z]{2}\d{13}\b",
    "address": r"\b\d+[A-Za-z\s,.-]+(?:Road|Street|Avenue|Lane|Plot|Block|Sector|Nagar|Colony|Park|Market|Chowk|Gali|Mohalla)\b",
}

# Common words that are NOT personal names
EXCLUDED_NAME_WORDS = {
    # Document types
    "permanent", "account", "number", "card", "identity", "document", "certificate", 
    "license", "passport", "voter", "driving", "aadhaar", "pan", "election", "commission",
    "मेरा", "आधार", "मेरी", "पहचान",

    # Government/Official terms
    "government", "india", "republic", "state", "union", "ministry", "department", 
    "authority", "board", "corporation", "limited", "company", "private", "public",
    
    # Common form fields
    "name", "father", "mother", "husband", "wife", "son", "daughter", "address", 
    "date", "birth", "issue", "expiry", "valid", "signature", "photo", "blood",
    "group", "emergency", "contact", "relationship", "occupation", "income",
    
    # Other common words
    "male", "female", "married", "single", "divorced", "widowed", "yes", "no",
    "true", "false", "valid", "invalid", "expired", "active", "inactive"
}

def is_likely_personal_name(text: str) -> bool:
    """Check if the text is likely a personal name and not a document field"""
    words = text.lower().split()
    
    # If any word is in excluded list, it's probably not a name
    if any(word in EXCLUDED_NAME_WORDS for word in words):
        return False
    
    # Names should be 2-4 words typically
    if len(words) < 2 or len(words) > 4:
        return False
    
    # Each word should be reasonable length for a name (2-15 characters)
    if any(len(word) < 2 or len(word) > 15 for word in words):
        return False
    
    # Check if it contains common Indian name patterns
    indian_name_patterns = [
        r"\b(kumar|singh|sharma|gupta|agarwal|jain|shah|patel|reddy|rao|nair|menon)\b",
        r"\b(raj|dev|deep|preet|jeet|veer|pal|das|lal|chand)\b",
        r"\b(devi|kumari|bai|ben)\b"
    ]
    
    text_lower = text.lower()
    has_indian_pattern = any(re.search(pattern, text_lower) for pattern in indian_name_patterns)
    
    # If it has Indian name patterns, more likely to be a name
    if has_indian_pattern:
        return True
    
    # For non-Indian patterns, be more strict
    # Names should not contain numbers or special characters
    if re.search(r'[0-9@#$%^&*()_+=\[\]{}|;:,.<>?/~`]', text):
        return False
    
    return True

def detect_pii(text: str) -> List[Dict[str, str]]:
    found = []
    
    # Process all patterns except names first
    for pii_type, pattern in PII_PATTERNS.items():
        if pii_type != "name":  # Skip name for now
            for match in re.findall(pattern, text):
                found.append({"type": pii_type, "value": match})
    
    # Special handling for names with filtering
    name_pattern = r"\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b"
    potential_names = re.findall(name_pattern, text)
    
    for potential_name in potential_names:
        if is_likely_personal_name(potential_name):
            found.append({"type": "name", "value": potential_name})
        else:
            print(f"🚫 Excluded potential name: '{potential_name}' (likely document field)")
    
    return found