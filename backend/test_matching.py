from nlp_engine import calculate_match_score, identify_missing_skills

# Test Inputs
resume_text = """
Junaid Ahmed
Email: junaid@example.com
Phone: +92 300 1234567
Qualifications: Bachelor of Science in Software Engineering (BSSE)
Skills: Python, SQL, Flask, Git, GitHub, JavaScript, HTML, CSS, React
Experience: Built an AI Resume Analyzer using Python, Flask, and React.
"""

jd_text = """
We are looking for a Software Engineer.
Requirements:
- Bachelor's degree in Computer Science or Software Engineering
- Skills: Python, React, SQL, Java
"""

# Calculate match score
score = calculate_match_score(resume_text, jd_text)
missing, present = identify_missing_skills(resume_text, jd_text)

print("=== NLP MATCHING ENGINE TEST ===")
print(f"Calculated Score: {score}%")
print(f"Matched Skills: {present}")
print(f"Missing Skills: {missing}")
print("================================")
