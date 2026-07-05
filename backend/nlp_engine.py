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
    'ad-serving platform', 'classroom management', 'database administration'
}

# Professional Traits database
PROFESSIONAL_TRAITS_DB = {
    'problem-solving', 'computer literacy', 'project management tools', 'communication'
}

# Standard Degrees Database
DEGREES_DB = {
    'bachelor', 'master', 'phd', 'b.s.', 'm.s.', 'b.tech', 'm.tech', 'ph.d.', 
    'bs', 'ms', 'doctorate', 'diploma', 'certification', 'degree'
}

# Semantic equivalences for matching skills outside primary database
SEMANTIC_EQUIVALENCES = {
    'express.js': {'node.js', 'backend tech'},
    'express': {'node.js', 'backend tech'},
    'fastapi': {'python', 'backend tech'},
    'django': {'python', 'backend tech'},
    'postgresql': {'sql', 'database administration'},
    'mysql': {'sql', 'database administration'},
    'mongodb': {'database administration', 'backend tech'},
    'git': {'project management tools'},
    'github': {'project management tools'}
}

# Words to ignore from Gaps
IGNORE_WORDS = {
    'professional', 'experience', 'senior', 'lead', 'manager', 'year', 'work', 
    'excellent', 'strong', 'mandatory', 'seeking', 'qualified', 'plus'
}

def clean_text(text):
    if not text: return []
    text = text.lower()
    
    # Data Cleaning via Regex (Remove Emails, URLs, Digits/Phone numbers)
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

def extract_qualifications(text):
    text_lower = text.lower()
    return {deg for deg in DEGREES_DB if deg in text_lower}

def check_semantic_match(jd_skill, resume_skills, resume_text_lower):
    """Verify direct, fuzzy, or semantic equivalency matches between resume and JD."""
    # 1. Direct or fuzzy match
    for r_skill in resume_skills:
        if fuzz.token_set_ratio(jd_skill, r_skill) >= 85:
            return True
            
    # 2. Check semantic equivalence from JD key mapping
    if jd_skill in SEMANTIC_EQUIVALENCES:
        equivalents = SEMANTIC_EQUIVALENCES[jd_skill]
        if equivalents.intersection(resume_skills):
            return True
            
    # 3. Check semantic equivalence from Resume key mapping
    for r_skill in resume_skills:
        if r_skill in SEMANTIC_EQUIVALENCES:
            if jd_skill in SEMANTIC_EQUIVALENCES[r_skill]:
                return True
                
    return False

def calculate_match_score(resume_text, jd_text):
    if not resume_text or not jd_text: return 0.0

    resume_text_lower = resume_text.lower()
    jd_text_lower = jd_text.lower()

    # Extract baseline resume and JD skills
    r_skills = extract_skills(resume_text_lower)
    j_skills = extract_skills(jd_text_lower)
    
    # Also append mapped semantic equivalents found in JD
    for k in SEMANTIC_EQUIVALENCES.keys():
        if k in jd_text_lower:
            j_skills.add(k)
            
    # 1. Technical Skills Score (70% Weight)
    tech_score = 0.0
    if j_skills:
        matched_tech = 0
        for j_skill in j_skills:
            if check_semantic_match(j_skill, r_skills, resume_text_lower):
                matched_tech += 1
        tech_score = (matched_tech / len(j_skills)) * 100.0

    # 2. Educational Degrees Score (20% Weight)
    r_degrees = extract_qualifications(resume_text_lower)
    j_degrees = extract_qualifications(jd_text_lower)
    degree_score = 0.0
    if j_degrees:
        matched_deg = len(r_degrees.intersection(j_degrees))
        degree_score = (matched_deg / len(j_degrees)) * 100.0
    else:
        degree_score = 100.0

    # 3. Professional Traits Score (10% Weight)
    r_traits = {t for t in PROFESSIONAL_TRAITS_DB if t in resume_text_lower}
    j_traits = {t for t in PROFESSIONAL_TRAITS_DB if t in jd_text_lower}
    traits_score = 0.0
    if j_traits:
        matched_traits = len(r_traits.intersection(j_traits))
        traits_score = (matched_traits / len(j_traits)) * 100.0
    else:
        traits_score = 100.0

    # Final Combined Weighted Score (70% Tech / 20% Degrees / 10% Traits)
    final_score = (tech_score * 0.7) + (degree_score * 0.2) + (traits_score * 0.1)
    return round(min(float(final_score), 100.0), 2)

def identify_missing_skills(resume_text, jd_text):
    resume_text_lower = resume_text.lower()
    jd_text_lower = jd_text.lower()

    r_skills = extract_skills(resume_text_lower)
    j_skills = extract_skills(jd_text_lower)
    
    # Account for semantic equivalences to prevent false gaps
    missing = set()
    present = set()
    
    # Populate JD targets
    for k in SEMANTIC_EQUIVALENCES.keys():
        if k in jd_text_lower:
            j_skills.add(k)

    for j_skill in j_skills:
        if check_semantic_match(j_skill, r_skills, resume_text_lower):
            present.add(j_skill)
        else:
            if j_skill not in IGNORE_WORDS:
                missing.add(j_skill)
                
    return list(missing), list(present)