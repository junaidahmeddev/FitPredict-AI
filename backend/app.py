import subprocess
import sys

# --- Step 2: Auto-Installer Code ---
required_packages = {
    'pytesseract': 'pytesseract',
    'pdf2image': 'pdf2image',
    'thefuzz': 'thefuzz',
    'python-Levenshtein': 'Levenshtein'
}

for package, import_name in required_packages.items():
    try:
        __import__(import_name)
    except ImportError:
        print(f"'{package}' (import name: '{import_name}') nahi mil raha, install kar raha hoon...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        except Exception as e:
            print(f"Auto-install for {package} failed: {e}")

# --- Rest of imports ---
import os
import io
import re
import nltk
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import docx2txt
import pytesseract
from pdf2image import convert_from_path
from nlp_engine import calculate_match_score, identify_missing_skills

# --- Ensure NLTK Data exists ---
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

# --- Configure Pytesseract for Windows ---
# Explicitly set the path to ensure pytesseract works on Windows without relying on system environment PATH
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "message": "AI Resume Analyzer Backend API is running. Send POST requests to /analyze"
    })

def mask_pii(text):
    """Mask email addresses, phone numbers, and home/street addresses to guarantee privacy compliance."""
    if not text: return ""
    # Mask Email
    text = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w{2,}\b', '[EMAIL_MASKED]', text)
    # Mask Phone Numbers (various standard international/local structures)
    text = re.sub(r'\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b', '[PHONE_MASKED]', text)
    # Mask Home Addresses & Street Names
    text = re.sub(r'\b\d+\s+(?:[Ss]treet|[Ss]t|[Rr]oad|[Rr]d|[Aa]venue|[Aa]ve|[Bb]lvd|[Cc]ourt|[Cc]t)\b[^\n]*', '[ADDRESS_MASKED]', text)
    return text

def extract_text(file):
    """Extract text from uploaded PDF or DOCX file, with OCR fallback for scanned PDFs using convert_from_path."""
    filename = file.filename.lower()
    try:
        if filename.endswith('.pdf'):
            # Read bytes once so we can reuse and save to a temp file if needed
            file_bytes = file.read()
            file.seek(0) # reset stream
            
            # 1. Try standard text extraction
            pdf_file = io.BytesIO(file_bytes)
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            
            # 2. Fallback to OCR if extracted text is too short (scanned PDF)
            if len(text.strip()) < 50:
                print("Extracted text too short (< 50 chars). Falling back to OCR...")
                
                # Save the file temporarily to use convert_from_path
                temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
                os.makedirs(temp_dir, exist_ok=True)
                temp_file_path = os.path.join(temp_dir, 'temp_resume.pdf')
                
                with open(temp_file_path, 'wb') as f:
                    f.write(file_bytes)
                
                try:
                    # Poppler bin path configuration for Windows pdf2image
                    poppler_path = r'C:\poppler-26.02.0\Library\bin'
                    images = convert_from_path(temp_file_path, dpi=300, poppler_path=poppler_path)
                    ocr_text = ""
                    for img in images:
                        ocr_text += pytesseract.image_to_string(img) + "\n"
                    
                    print("OCR Extracted Text:", ocr_text)
                    if ocr_text.strip():
                        text = ocr_text
                except Exception as ocr_err:
                    print(f"OCR Extraction failed: {ocr_err}")
                finally:
                    # Secure cleanup of temporary file
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)
            
            return text
        elif filename.endswith('.docx'):
            return docx2txt.process(file)
        else:
            return file.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    resume_text = ""
    jd_text = ""
    file_name = ""

    # Print incoming request details for debugging
    print("--- INCOMING REQUEST DEBUG ---")
    print("Headers:", dict(request.headers))
    print("Files keys:", list(request.files.keys()))
    print("Form keys:", list(request.form.keys()))
    if 'resume' in request.files:
        print("Resume file details:", request.files['resume'].filename)
    else:
        print("WARNING: 'resume' key not found in request.files!")
    print("---------------------------------")

    # Check for multipart/form-data files and form parameters individually
    if 'resume' in request.files:
        resume_file = request.files['resume']
        resume_text = extract_text(resume_file)
        file_name = resume_file.filename

    if 'job_description' in request.form:
        jd_text = request.form['job_description']

    # Fallback to JSON payload if either is empty
    if not resume_text or not jd_text:
        data = request.get_json(silent=True) or {}
        if not resume_text:
            resume_text = data.get('resume_text', '')
            file_name = data.get('file_name', 'pasted_text')
        if not jd_text:
            jd_text = data.get('job_description', '')

    # Mask Candidate PII (Phone/Email/Address) before passing data to calculations
    resume_text_masked = mask_pii(resume_text)

    # Print extracted text preview to console for debug
    print("Extracted Text Preview (Masked):", resume_text_masked[:500] if resume_text_masked else "[Empty Text]")

    # Sanitize Job Description: strip whitespace, handle comma-separated values
    if jd_text:
        if ',' in jd_text:
            jd_text = " ".join([part.strip() for part in jd_text.split(',') if part.strip()])
        else:
            jd_text = jd_text.strip()

    # Clear validation responses with exact details of what is missing
    if not resume_text_masked and not jd_text:
        return jsonify({"error": "Missing Data: Please upload a Resume file and enter a Job Description."}), 400
    if not resume_text_masked:
        return jsonify({"error": "Missing Data: Resume file could not be parsed or is empty. Please upload a valid, non-empty Resume PDF/DOCX file."}), 400
    if not jd_text:
        return jsonify({"error": "Missing Data: Please enter a Job Description."}), 400
    
    # AI Logic using the masked text
    match_score = calculate_match_score(resume_text_masked, jd_text)
    missing_skills, present_skills = identify_missing_skills(resume_text_masked, jd_text)

    # Verdict
    verdict = "Poor Match"
    if match_score >= 80: verdict = "Excellent Match"
    elif match_score >= 60: verdict = "Good Match"
    elif match_score >= 40: verdict = "Average Match"

    # Dynamic Recruiter Recommendation Summary
    recommendation = f"The candidate matches {int(match_score)}% of the target requirements. "
    if present_skills:
        recommendation += f"Strong technical skills identified: {', '.join([s.capitalize() for s in present_skills])}. "
    if missing_skills:
        recommendation += f"Key missing core skills to address: {', '.join([s.capitalize() for s in missing_skills])}."
    else:
        recommendation += "No critical skill gaps identified."

    return jsonify({
        # Legacy compatibility keys
        "match_score": match_score,
        "verdict": verdict,
        "matching_skills": [skill.capitalize() for skill in present_skills],
        "missing_skills": [skill.capitalize() for skill in missing_skills],
        "file_name": file_name,
        "resume_text": resume_text_masked,
        
        # Talent Intelligence structured JSON format
        "MatchScore": int(match_score),
        "DetectedSkills": [skill.capitalize() for skill in present_skills],
        "MissingSkills": [skill.capitalize() for skill in missing_skills],
        "Recommendation": recommendation
    })

if __name__ == '__main__':
    # Railway/Render dynamic port support
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)