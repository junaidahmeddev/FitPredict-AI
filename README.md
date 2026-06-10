# 🚀 AI Resume Analyzer & Intelligent Job-Fit Predictor

An advanced, full-stack NLP-powered recruitment tool that automates resume screening and job fit analysis. Using vector space models, the system parses uploaded resumes against specific job descriptions to provide accurate match scoring, identified skill sets, and automated technical skill gap analysis.

---

## 🌟 Key Features

* **Automated Text Extraction:** Seamlessly extracts and preprocesses raw content from PDF and DOCX formats.
* **Smart Matching Logic (TF-IDF & Cosine Similarity):** Converts unstructured textual data into mathematical vectors to evaluate precise semantic alignment.
* **Dynamic Skill Gaps Detection:** Scans the target job description for core competencies and flags missing technologies/tools as premium red visual badges.
* **Premium Glassmorphic UI:** A clean, dark-themed analytics dashboard featuring dynamic state tracking, active pulse connection indicators, and graceful error recovery.

---

## 🛠️ Tech Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js (Hooks, Modern Glassmorphism, Tailwind CSS) |
| **Backend** | Flask (Python REST API) |
| **AI / NLP Core** | NLTK (Tokenization, Stopwords Removal, WordNet) |
| **Machine Learning** | Scikit-learn (TF-IDF Vectorizer, Cosine Similarity) |
| **Hosting** | Vercel (Frontend Deployment) |

---

## 📊 Core Architecture & Logic

1. **Preprocessing Pipeline:** The system cleans the input text by removing punctuation, formatting, and standard NLTK stop words.
2. **Vectorization:** Text structures from both the Resume and Job Description are converted into sparse numerical matrices using **TF-IDF Vectorization**.
3. **Similarity Calculation:** The angular distance between the two vectors is calculated using **Cosine Similarity**, returning a definitive match score between `0.0` and `1.0`.
4. **Gap Analysis:** A frontend logic engine compares extracted profile skills against requested job keywords to generate real-time deficiency markers.

---

## ⚙️ Getting Started & Local Setup

Follow these steps to configure and run the full-stack system locally on your machine.

### 1. Repository Setup
```bash
git clone [https://github.com/junaidahmeddev/Next-Gen-AI-Resume-Analyzer.git](https://github.com/junaidahmeddev/Next-Gen-AI-Resume-Analyzer.git)
cd Next-Gen-AI-Resume-Analyzer
2. Backend Configuration (Flask)
Bash
# Navigate to the backend folder
cd backend

# Create and activate a Python virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Mac/Linux:
source .venv/bin/activate

# Install requirements & start server
pip install -r requirements.txt
python app.py
The core NLP server will launch dynamically on http://127.0.0.1:5000.

3. Frontend Configuration (React)
Open a new separate terminal window and run:

Bash
# Navigate to the frontend folder from the root
cd frontend

# Install Node modules & start development server
npm install
npm start
The interactive dashboard interface will open automatically on http://localhost:3001.

📈 Evaluation & Testing Profiles
To verify the precision of the matching matrix, you can test using these two polar profiles:

Profile A (High Match Test): Upload a Python-focused engineering resume against a Machine Learning / Backend Developer JD. Expect a high match score (>70%) with identified tags like Python, SQL, and Flask.

Profile B (Low Match/Cross-Field Test): Upload the same engineering resume against a Senior Graphic Designer JD. Expect a drastically low score (~25%) along with clear amber/red labels highlighting technical gaps like Photoshop, Figma, and Illustrator.

⭐ Star this repository if you find it useful! Developed with 💻 by Junaid Ahmed
