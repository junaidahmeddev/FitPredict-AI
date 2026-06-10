from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import docx2txt
from nlp_engine import calculate_match_score, identify_missing_skills

app = Flask(__name__)
CORS(app)  # Enables Cross-Origin Resource Sharing (Critical for React Frontend)

def extract_text(file):
    """
    Extract text from uploaded file (PDF or DOCX).
    """
    filename = file.filename.lower()
    try:
        if filename.endswith('.pdf'):
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
        elif filename.endswith('.docx'):
            return docx2txt.process(file)
        else:
            return file.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return ""

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    payload = request.get_json(silent=True) or {}
    resume_text = payload.get('resume_text', '')
    jd_text = payload.get('job_description', '')
    file_name = payload.get('file_name', '')

    if (not resume_text or not jd_text) and 'resume' in request.files and 'job_description' in request.form:
        resume_file = request.files['resume']
        jd_text = request.form['job_description']
        resume_text = extract_text(resume_file)
        file_name = resume_file.filename

    if not resume_text or not jd_text:
        return jsonify({"error": "Missing Data: Please upload a resume and enter a JD."}), 400
    
    # Step 2: AI Calculation (TF-IDF & Cosine Similarity)
    # References SRS Section 2.2 for Mathematical Modeling
    match_score = calculate_match_score(resume_text, jd_text)

    # Step 3: Skill Gap Analysis
    # Compares JD requirements against Resume contents
    missing_skills, present_skills = identify_missing_skills(resume_text, jd_text)

    # Step 4: Generate Verdict based on Score
    if match_score >= 80:
        verdict = "Excellent Match"
    elif match_score >= 60:
        verdict = "Good Match"
    elif match_score >= 40:
        verdict = "Average Match"
    else:
        verdict = "Poor Match"

    # Return Data to Frontend
    return jsonify({
        "match_score": match_score,
        "verdict": verdict,
        "matching_skills": [skill.capitalize() for skill in present_skills],
        "missing_skills": [skill.capitalize() for skill in missing_skills],
        "resume_text": resume_text,
        "file_name": file_name
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)