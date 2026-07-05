import nltk
import re
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from thefuzz import fuzz

# --- Setup (Fixed for Render Deployment) ---
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('tokenizers/punkt_tab')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('punkt')
    nltk.download('punkt_tab')
    nltk.download('stopwords')
    nltk.download('wordnet')

lemmatizer = WordNetLemmatizer()

# --- Core Knowledge Base (Lowercased Set) ---
TECHNICAL_SKILLS_DB = {
    'python', 'java', 'c++', 'c#', 'javascript', 'sql', 'react', 'node.js', 
    'web design', 'design thinking', 'wireframe creation', 'front end coding', 'backend tech',
    'ad-serving platform', 'classroom management', 'database administration',
    'problem-solving', 'computer literacy', 'project management tools', 'communication'
}

# Words to ignore from Gaps
IGNORE_WORDS = {
    'professional', 'experience', 'senior', 'lead', 'manager', 'year', 'work', 
    'excellent', 'strong', 'mandatory', 'seeking', 'qualified', 'plus'
}

def clean_text(text):
    if not text: return []
    text = text.lower()
    
    # 3. Data Cleaning via Regex (Remove Emails, URLs, Digits/Phone numbers)
    text = re.sub(r'\S+@\S+', ' ', text)
    text = re.sub(r'http\S+|www\S+', ' ', text)
    text = re.sub(r'\d+', ' ', text)
    
    # Preserve '+', '#' and alphanumeric characters
    text = re.sub(r'[^a-zA-Z0-9\+\#\s]', ' ', text)
    tokens = word_tokenize(text)
    stop = set(stopwords.words('english'))
    # Preserve technical context (even if they are stop words like 'c' or 'r')
    return [lemmatizer.lemmatize(t) for t in tokens if (t not in stop or t in TECHNICAL_SKILLS_DB)]

def extract_skills(text):
    if not text: return set()
    text_lower = text.lower()
    
    # Extract candidates to match against (words and n-grams up to 3 words)
    tokens = re.findall(r'[a-zA-Z0-9\+\#\-\.]+', text_lower)
    candidates = []
    for i in range(len(tokens)):
        for l in range(1, 4):
            if i + l <= len(tokens):
                candidates.append(" ".join(tokens[i:i+l]))
    
    candidates = list(set(candidates))
    extracted = set()
    
    for skill in TECHNICAL_SKILLS_DB:
        # Fast path: check exact substring match first
        if skill in text_lower:
            extracted.add(skill)
            continue
            
        # Fuzzy match path with Levenshtein ratio and partial ratio
        for cand in candidates:
            # Case sensitivity handled because candidates & TECHNICAL_SKILLS_DB are lowercase
            if fuzz.ratio(skill, cand) >= 85 or fuzz.partial_ratio(skill, cand) >= 90:
                extracted.add(skill)
                break
                
    return extracted

def calculate_match_score(resume_text, jd_text):
    if not resume_text or not jd_text: return 0.0

    resume_text_lower = resume_text.lower()
    jd_text_lower = jd_text.lower()

    # 1. Cleaning
    r_cleaned = " ".join(clean_text(resume_text_lower))
    j_cleaned = " ".join(clean_text(jd_text_lower))
    
    # 2. Key Skill Overlap (70% weight)
    r_skills = extract_skills(resume_text_lower)
    j_skills = extract_skills(jd_text_lower)
    
    skill_score = 0.0
    if j_skills:
        match_count = len(r_skills.intersection(j_skills))
        skill_score = (match_count / len(j_skills)) * 100.0
    
    # 3. Cosine Similarity (30% weight) with safety check
    cosine_sim = 0.0
    if r_cleaned.strip() and j_cleaned.strip():
        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2))
            matrix = vectorizer.fit_transform([r_cleaned, j_cleaned])
            # Check for non-zero vectors
            if matrix[0].nnz > 0 and matrix[1].nnz > 0:
                cosine_sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0] * 100.0
            else:
                # Fallback to skill score if vector norm is 0
                cosine_sim = skill_score
        except Exception as e:
            print(f"Error in similarity check: {e}")
            cosine_sim = skill_score
    else:
        cosine_sim = skill_score
        
    final_score = (cosine_sim * 0.3) + (skill_score * 0.7)
    return round(min(float(final_score), 100.0), 2)

def identify_missing_skills(resume_text, jd_text):
    resume_text_lower = resume_text.lower()
    jd_text_lower = jd_text.lower()

    r_skills = extract_skills(resume_text_lower)
    j_skills = extract_skills(jd_text_lower)
    
    missing = j_skills - r_skills - IGNORE_WORDS
    present = j_skills.intersection(r_skills)
    
    return list(missing), list(present)