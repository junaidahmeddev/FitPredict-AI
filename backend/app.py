import os
import nltk
from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import docx2txt
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

app = Flask(__name__)
CORS(app)

def extract_text(file):
    """Extract text from uploaded PDF or DOCX file."""
    filename = file.filename.lower()
    try:
        if filename.endswith('.pdf'):
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
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

    # Check if files are sent via multipart/form-data
    if 'resume' in request.files and 'job_description' in request.form:
        resume_file = request.files['resume']
        jd_text = request.form['job_description']
        resume_text = extract_text(resume_file)
        file_name = resume_file.filename
    else:
        # Fallback to JSON payload
        data = request.get_json(silent=True) or {}
        resume_text = data.get('resume_text', '')
        jd_text = data.get('job_description', '')
        file_name = data.get('file_name', 'pasted_text')

    if not resume_text or not jd_text:
        return jsonify({"error": "Missing Data: Please provide both resume and JD."}), 400
    
    # AI Logic
    match_score = calculate_match_score(resume_text, jd_text)
    missing_skills, present_skills = identify_missing_skills(resume_text, jd_text)

    # Verdict
    if match_score >= 80: verdict = "Excellent Match"
    elif match_score >= 60: verdict = "Good Match"
    elif match_score >= 40: verdict = "Average Match"
    else: verdict = "Poor Match"

    return jsonify({
        "match_score": match_score,
        "verdict": verdict,
        "matching_skills": [skill.capitalize() for skill in present_skills],
        "missing_skills": [skill.capitalize() for skill in missing_skills],
        "file_name": file_name
    })

if __name__ == '__main__':
    # Railway/Render dynamic port support
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)