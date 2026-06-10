import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'https://fit-predict-ai.vercel.app';
const DEVELOPER_SKILLS = ['python', 'sql', 'flask', 'fastapi', 'git', 'github', 'nltk', 'machine learning'];
const DESIGN_SKILLS = ['photoshop', 'illustrator', 'figma', 'indesign', 'typography', 'ui/ux', 'branding'];
const ALL_SKILLS = [...DEVELOPER_SKILLS, ...DESIGN_SKILLS];

const normalizeSkillText = (value = '') => value.toLowerCase().replace(/[^a-z0-9#+]+/g, ' ').replace(/\s+/g, ' ').trim();

const findSkillsInText = (text = '') => {
  const normalizedText = normalizeSkillText(text);
  return ALL_SKILLS.filter((skill) => normalizedText.includes(normalizeSkillText(skill)));
};

const formatSkillLabel = (skill) => skill.toUpperCase() === 'UI/UX' ? 'UI/UX' : skill.replace(/\b\w/g, (char) => char.toUpperCase());

const getVerdictFromScore = (score) => {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Average Match';
  return 'Poor Match';
};

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="upload-icon">
      <path d="M12 3v10m0-10 4 4m-4-4-4 4" />
      <path d="M4 14.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4.5" />
    </svg>
  );
}

function EngineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="feature-svg">
      <path d="M9 3h6v4H9z" />
      <rect x="5" y="8" width="14" height="10" rx="2" />
      <path d="M8 12h8M12 8v4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="feature-svg">
      <path d="M4 19.5h16" />
      <path d="M7 15V9M12 15V5M17 15v-7" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="mini-info-icon">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

function RadarPlaceholder() {
  return (
    <div className="empty-radar" aria-hidden="true">
      <span className="radar-ring radar-ring-one" />
      <span className="radar-ring radar-ring-two" />
      <span className="radar-sweep" />
      <span className="radar-core" />
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [matchScore, setMatchScore] = useState(null);
  const [identifiedSkills, setIdentifiedSkills] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isMatchingOpen, setIsMatchingOpen] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const [predictionMade, setPredictionMade] = useState(false);

  const handleAnalyze = async () => {
    setMatchScore(null);
    setIdentifiedSkills([]);
    setSkillGaps([]);
    setValidationError(null);
    setBackendError(null);

    if (!file || !jd.trim()) {
      setValidationError('Please upload a resume and enter a job description.');
      setPredictionMade(false);
      return;
    }

    const jobDescriptionStateValue = jd;
    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescriptionStateValue);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, formData);
      const resumeTextFromBackend = response?.data?.resume_text || '';
      const resumeTextForAnalysis = normalizeSkillText(resumeTextFromBackend);
      const jobTextForAnalysis = normalizeSkillText(jobDescriptionStateValue);
      const localIdentifiedSkills = findSkillsInText(resumeTextForAnalysis);
      const jdSkills = ALL_SKILLS.filter((skill) => jobTextForAnalysis.includes(normalizeSkillText(skill)));
      const localSkillGaps = jdSkills.filter((skill) => !localIdentifiedSkills.includes(skill));
      const backendMatchScore = Number(response?.data?.match_score ?? 0);
      const localMatchScore = jdSkills.length > 0
        ? Math.round(((jdSkills.length - localSkillGaps.length) / jdSkills.length) * 100)
        : backendMatchScore;

      setMatchScore(localMatchScore);
      setIdentifiedSkills(
        response?.data?.matching_skills?.length
          ? response.data.matching_skills
          : localIdentifiedSkills.map(formatSkillLabel)
      );
      setSkillGaps(
        response?.data?.missing_skills?.length
          ? response.data.missing_skills
          : localSkillGaps.map(formatSkillLabel)
      );
      setPredictionMade(true);
    } catch (error) {
      console.error("API Error:", error);
      setLoading(false);
      setBackendError(error?.response?.data?.error || 'Connection Failed: Ensure Backend is Live');
      setPredictionMade(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setFile(selectedFile);
    } else {
      alert("Invalid File Format: Please select a .pdf or .docx file.");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const toggleMatchingLogic = () => {
    setIsMatchingOpen((current) => !current);
  };

  const handleMatchingLogicKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleMatchingLogic();
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-section">
          <h2 className="project-title">Resume Analyzer <br /> <span>| Job Fit Prediction</span></h2>
        </div>
        <div className="sidebar-features">
          <div className="feature-item active-feature">
            <span className="feature-icon">
              <EngineIcon />
            </span>
            <div className="feature-text"><strong>NLP Engine</strong><p>TF-IDF Processing</p></div>
          </div>
          <div
            className="feature-item matching-toggle cursor-pointer"
            role="button"
            tabIndex={0}
            aria-expanded={isMatchingOpen}
            onClick={toggleMatchingLogic}
            onKeyDown={handleMatchingLogicKeyDown}
          >
            <span className="feature-icon">
              <ChartIcon />
            </span>
            <div className="feature-text">
              <strong>Matching Logic</strong>
              <p>Cosine Similarity</p>
            </div>
          </div>
          <div className={`matching-dropdown ${isMatchingOpen ? 'open' : ''}`}>
            <div className="matching-info-panel">
              <div className="matching-info-header">
                <span className="matching-info-badge"><InfoIcon /> Logic Note</span>
                <span className="matching-info-state">{isMatchingOpen ? 'Expanded' : 'Collapsed'}</span>
              </div>
              <p>
                How it matches: The system converts both the Resume and the Job Description into mathematical vectors using TF-IDF Vectorization. It then applies Cosine Similarity to calculate the angular distance between the vectors. A score closer to 1.0 indicates an exact semantic and keyword alignment.
              </p>
            </div>
          </div>
        </div>
        <div className="status-container">
          <div className="nlp-badge">AI Core v1.0.4</div>
          <div className="status-dot"><span className="dot animate-pulse"></span> System Online (Live)</div>
        </div>
      </aside>

      <main className="main-viewport">
        <header className="header-bar">
          <div className="header-content">
            <h3>Analytics Dashboard</h3>
            <span className="engine-label">Vectorization: TF-IDF</span>
          </div>
        </header>
        <div className="content-grid">
          <section className="input-panel bg-slate-900/60 backdrop-blur-md border border-slate-800">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">Data Ingestion</p>
                <h4>Submit source material</h4>
              </div>
            </div>
            <label
              className={`file-upload ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <span className="upload-mark">
                <UploadIcon />
              </span>
              <input type="file" onChange={(e) => handleFileSelect(e.target.files[0])} accept=".pdf,.docx" style={{ display: 'none' }} />
              <span className="upload-copy">{file ? file.name : "Click to Upload Resume (PDF/DOCX)"}</span>
              <span className="upload-hint">Drag and drop is supported</span>
            </label>
            <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste Job Description here..."></textarea>
            {validationError && (
              <div className="backend-error-banner" role="alert">
                <span className="backend-error-dot" />
                <div>
                  <strong>Input required</strong>
                  <p>{validationError}</p>
                </div>
              </div>
            )}
            {backendError && (
              <div className="backend-error-banner" role="alert">
                <span className="backend-error-dot" />
                <div>
                  <strong>Backend unavailable</strong>
                  <p>{backendError}</p>
                </div>
              </div>
            )}
            <button onClick={handleAnalyze} disabled={loading} className="analyze-btn bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl">
              {loading ? "Processing..." : "Execute Prediction"}
            </button>
          </section>

          <section className="result-panel bg-slate-900/60 backdrop-blur-md border border-slate-800">
            {matchScore !== null ? (
              <div className="fade-in">
                <div className="score-summary">
                  <div className="radial-progress">
                    <span className="score-num">{matchScore}%</span>
                    <span className="score-label">Match Score</span>
                  </div>
                  <div className="verdict-box">{getVerdictFromScore(matchScore)}</div>
                </div>
                <div className="skill-card">
                  <h5>Identified Skills</h5>
                  <div className="tag-list">
                    {identifiedSkills.length > 0 ? identifiedSkills.map((skill, index) => <span key={index} className="tag-match">{skill}</span>) : <span className="empty-state-copy">No identified skills found.</span>}
                  </div>
                </div>
                <div className="skill-card">
                  <h5>Technical Skill Gaps</h5>
                  <div className="tag-list">
                    {skillGaps.length > 0 ? skillGaps.map((skill, index) => (
                      <span key={index} className="tag-gap bg-red-950/40 text-red-400 border border-red-900/50 px-3 py-1 rounded-full text-xs font-medium m-1 inline-block">
                        {skill}
                      </span>
                    )) : predictionMade ? <span className="empty-state-copy">No critical skill gaps identified.</span> : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <RadarPlaceholder />
                <div className="empty-state-copy">
                  <p className="empty-state-kicker">System ready</p>
                  <h4>Awaiting Data Input for Prediction Analysis</h4>
                  <span>Upload a resume and paste a job description to begin the fit scan.</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
export default App;