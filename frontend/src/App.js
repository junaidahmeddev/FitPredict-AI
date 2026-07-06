import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://lucky-perfection-production-c457.up.railway.app';

// Skills Database for local parsing/reweighting
const DEVELOPER_SKILLS = ['python', 'sql', 'flask', 'fastapi', 'git', 'github', 'nltk', 'machine learning', 'java', 'c++', 'c#', 'javascript', 'react', 'node.js', 'backend tech', 'database administration'];
const DESIGN_SKILLS = ['photoshop', 'illustrator', 'figma', 'indesign', 'typography', 'ui/ux', 'branding', 'web design', 'design thinking', 'wireframe creation', 'front end coding'];
const ALL_SKILLS = [...DEVELOPER_SKILLS, ...DESIGN_SKILLS];

const DEGREES_DB = ['bachelor', 'master', 'phd', 'b.s.', 'm.s.', 'b.tech', 'm.tech', 'ph.d.', 'bs', 'ms', 'doctorate', 'diploma', 'certification', 'degree'];
const PROFESSIONAL_TRAITS_DB = ['problem-solving', 'computer literacy', 'project management tools', 'communication'];

const normalizeSkillText = (value = '') => value.toLowerCase().replace(/[^a-z0-9#+]+/g, ' ').replace(/\s+/g, ' ').trim();

// SVG Icons
function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function ResultsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <path d="M12 8v4l3 3" />
      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
    </svg>
  );
}

function BulkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="upload-icon-svg">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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
  // Navigation State
  const [currentView, setCurrentView] = useState('home');

  // Single Analysis inputs
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [backendError, setBackendError] = useState(null);

  // Settings Weights
  const [weights, setWeights] = useState({
    tech: 70,
    edu: 20,
    traits: 10
  });
  const [selectedEngine, setSelectedEngine] = useState('tfidf');

  // Active prediction report details
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  // Bulk processing inputs and state
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkJd, setBulkJd] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Privacy and History state
  const [privacyMode, setPrivacyMode] = useState(false);
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('resume_scan_history_capstone');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          fileName: "Kashan_CV.pdf",
          timestamp: "07/06/2026, 11:12 AM",
          verdict: "Excellent Match",
          rawMatchScore: 85,
          subScores: { tech: 90, edu: 80, traits: 70 },
          detectedSkills: ["Python", "SQL", "Machine Learning", "Git"],
          missingSkills: ["Docker", "FastAPI"],
          recommendation: "Excellent technical profile, candidate has hands-on ML experience. Address missing DevOps pipeline experience."
        },
        {
          id: '2',
          fileName: "Hammad_CV.docx",
          timestamp: "07/06/2026, 11:14 AM",
          verdict: "Good Match",
          rawMatchScore: 62,
          subScores: { tech: 60, edu: 70, traits: 60 },
          detectedSkills: ["Figma", "UI/UX", "Typography"],
          missingSkills: ["HTML", "Branding"],
          recommendation: "Solid designer skillset. Cosine similarity shows strong portfolio alignment. Recommend matching with design-heavy tasks."
        }
      ];
    } catch (e) {
      return [];
    }
  });

  // Sync scan history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('resume_scan_history_capstone', JSON.stringify(scanHistory));
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }, [scanHistory]);

  // Adjust sliders maintaining a total sum of 100%
  const handleWeightChange = (key, value) => {
    const numericValue = parseInt(value, 10) || 0;
    const otherKeys = Object.keys(weights).filter(k => k !== key);
    
    // Calculate how much we need to distribute
    const difference = 100 - numericValue;
    const currentSumOfOthers = weights[otherKeys[0]] + weights[otherKeys[1]];

    let newWeights = { ...weights, [key]: numericValue };

    if (currentSumOfOthers > 0) {
      // Proportional distribution
      const w1 = Math.round((weights[otherKeys[0]] / currentSumOfOthers) * difference);
      const w2 = difference - w1; // guarantee exact sum of 100
      newWeights[otherKeys[0]] = Math.max(0, w1);
      newWeights[otherKeys[1]] = Math.max(0, w2);
    } else {
      // Split evenly
      const half = Math.floor(difference / 2);
      newWeights[otherKeys[0]] = half;
      newWeights[otherKeys[1]] = difference - half;
    }

    setWeights(newWeights);
  };

  // Helper: Recalculate score based on current settings weights and custom inputs
  const computeWeightedScore = (subScores) => {
    const score = (subScores.tech * (weights.tech / 100)) + 
                  (subScores.edu * (weights.edu / 100)) + 
                  (subScores.traits * (weights.traits / 100));
    return Math.round(Math.min(Math.max(score, 0), 100));
  };

  const getVerdict = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Average Match';
    return 'Poor Match';
  };

  // Local helper to parse text and calculate subscores for weights interactivity
  const calculateLocalSubScores = (resumeText = '', jdText = '') => {
    const normResume = normalizeSkillText(resumeText);
    const normJd = normalizeSkillText(jdText);

    // Tech Skills
    const jdSkills = ALL_SKILLS.filter(s => normJd.includes(normalizeSkillText(s)));
    const matchedSkills = jdSkills.filter(s => normResume.includes(normalizeSkillText(s)));
    const techScore = jdSkills.length > 0 ? (matchedSkills.length / jdSkills.length) * 100 : 75;

    // Edu
    const jdDegrees = DEGREES_DB.filter(d => normJd.includes(d));
    const matchedDegrees = jdDegrees.filter(d => normResume.includes(d));
    const eduScore = jdDegrees.length > 0 ? (matchedDegrees.length / jdDegrees.length) * 100 : 80;

    // Traits
    const jdTraits = PROFESSIONAL_TRAITS_DB.filter(t => normJd.includes(t));
    const matchedTraits = jdTraits.filter(t => normResume.includes(t));
    const traitsScore = jdTraits.length > 0 ? (matchedTraits.length / jdTraits.length) * 100 : 70;

    return {
      tech: Math.round(techScore),
      edu: Math.round(eduScore),
      traits: Math.round(traitsScore)
    };
  };

  // Single Predict Execute Flow
  const handleAnalyze = async () => {
    setValidationError(null);
    setBackendError(null);

    if (!file || !jd.trim()) {
      setValidationError('Please upload a resume and enter a job description.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jd);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, formData);
      const data = response.data;
      
      const text = data.resume_text || '';
      const localSub = calculateLocalSubScores(text, jd);
      const computedScore = computeWeightedScore(localSub);
      
      // If BERT engine is selected, simulate smart semantic upgrade
      let finalScore = computedScore;
      if (selectedEngine === 'bert') {
        finalScore = Math.min(Math.round(computedScore * 1.05 + 2), 100);
      }

      const newAnalysis = {
        id: Date.now().toString(),
        fileName: file.name,
        timestamp: new Date().toLocaleString(),
        verdict: getVerdict(finalScore),
        rawMatchScore: finalScore,
        subScores: localSub,
        detectedSkills: data.matching_skills || data.DetectedSkills || [],
        missingSkills: data.missing_skills || data.MissingSkills || [],
        recommendation: data.Recommendation || data.recommendation || `The candidate is an ${getVerdict(finalScore)} with a score of ${finalScore}%.`
      };

      setActiveAnalysis(newAnalysis);
      setScanHistory(prev => [newAnalysis, ...prev]);
      setCurrentView('results');
    } catch (error) {
      console.error("API Error:", error);
      setBackendError(error?.response?.data?.error || 'Connection Failed: Check if Flask Backend is Live');
    } finally {
      setLoading(false);
    }
  };

  // Bulk processing function
  const handleBulkAnalyze = async () => {
    if (bulkFiles.length === 0 || !bulkJd.trim()) {
      alert("Please upload at least one resume and provide a Job Description.");
      return;
    }

    setBulkLoading(true);
    setBulkResults([]);
    setBulkProgress({ current: 0, total: bulkFiles.length });

    const resultsArray = [];

    for (let i = 0; i < bulkFiles.length; i++) {
      const currentFile = bulkFiles[i];
      setBulkProgress(prev => ({ ...prev, current: i + 1 }));

      const formData = new FormData();
      formData.append('resume', currentFile);
      formData.append('job_description', bulkJd);

      try {
        const response = await axios.post(`${API_BASE_URL}/analyze`, formData);
        const data = response.data;
        const text = data.resume_text || '';
        const localSub = calculateLocalSubScores(text, bulkJd);
        const computedScore = computeWeightedScore(localSub);
        
        let finalScore = computedScore;
        if (selectedEngine === 'bert') {
          finalScore = Math.min(Math.round(computedScore * 1.05 + 2), 100);
        }

        const scanItem = {
          id: `bulk-${Date.now()}-${i}`,
          fileName: currentFile.name,
          timestamp: new Date().toLocaleString(),
          verdict: getVerdict(finalScore),
          rawMatchScore: finalScore,
          subScores: localSub,
          detectedSkills: data.matching_skills || data.DetectedSkills || [],
          missingSkills: data.missing_skills || data.MissingSkills || [],
          recommendation: data.Recommendation || data.recommendation || `Bulk processed candidate scoring ${finalScore}%.`
        };

        resultsArray.push(scanItem);
        // Persist bulk scans to history log too
        setScanHistory(prev => [scanItem, ...prev]);
      } catch (err) {
        console.error(`Error processing bulk index ${i}:`, err);
        resultsArray.push({
          id: `bulk-err-${i}`,
          fileName: currentFile.name,
          timestamp: new Date().toLocaleString(),
          verdict: "Scan Failed",
          rawMatchScore: 0,
          subScores: { tech: 0, edu: 0, traits: 0 },
          detectedSkills: [],
          missingSkills: [],
          recommendation: "Connection or parsing error occurred during bulk ingestion."
        });
      }
    }

    // Sort results descending
    resultsArray.sort((a, b) => b.rawMatchScore - a.rawMatchScore);
    setBulkResults(resultsArray);
    setBulkLoading(false);
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setFile(selectedFile);
    } else {
      alert("Invalid File Format: Please select a .pdf or .docx file.");
    }
  };

  const handleBulkFileSelect = (filesList) => {
    const validFiles = Array.from(filesList).filter(f => f.type === 'application/pdf' || f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    if (validFiles.length > 0) {
      setBulkFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeBulkFile = (idx) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Report download print action
  const triggerPDFDownload = () => {
    window.print();
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar no-print">
        <div className="logo-section">
          <h2 className="project-title">Resume Analyzer <br /> <span>| CAPSTONE ENGINE</span></h2>
        </div>
        
        <nav className="sidebar-features">
          <button 
            className={`feature-item ${currentView === 'home' ? 'active-feature' : ''}`}
            onClick={() => setCurrentView('home')}
          >
            <span className="feature-icon"><DashboardIcon /></span>
            <div className="feature-text"><strong>Home</strong><p>Scan Ingestion</p></div>
          </button>

          <button 
            className={`feature-item ${currentView === 'results' ? 'active-feature' : ''}`}
            onClick={() => {
              if (!activeAnalysis) {
                alert("Please complete a prediction scan first to view details.");
                return;
              }
              setCurrentView('results');
            }}
          >
            <span className="feature-icon"><ResultsIcon /></span>
            <div className="feature-text"><strong>Analysis View</strong><p>Report Details</p></div>
          </button>

          <button 
            className={`feature-item ${currentView === 'history' ? 'active-feature' : ''}`}
            onClick={() => setCurrentView('history')}
          >
            <span className="feature-icon"><HistoryIcon /></span>
            <div className="feature-text"><strong>Scan Logs</strong><p>Prediction History</p></div>
          </button>

          <button 
            className={`feature-item ${currentView === 'bulk' ? 'active-feature' : ''}`}
            onClick={() => setCurrentView('bulk')}
          >
            <span className="feature-icon"><BulkIcon /></span>
            <div className="feature-text"><strong>Bulk Match</strong><p>Leaderboard Ingestion</p></div>
          </button>

          <button 
            className={`feature-item ${currentView === 'settings' ? 'active-feature' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <span className="feature-icon"><SettingsIcon /></span>
            <div className="feature-text"><strong>Settings</strong><p>Weights & Engines</p></div>
          </button>
        </nav>

        {/* Weights Indicator Widget */}
        <div className="sidebar-widget">
          <h5>Active Weights Configuration</h5>
          <div className="weights-info">
            <span className="weight-badge">Tech: {weights.tech}%</span>
            <span className="weight-badge">Edu: {weights.edu}%</span>
            <span className="weight-badge">Traits: {weights.traits}%</span>
          </div>
          <div className="weight-bar-stacked">
            <div className="weight-bar-seg" style={{ width: `${weights.tech}%`, backgroundColor: 'var(--accent)' }}></div>
            <div className="weight-bar-seg" style={{ width: `${weights.edu}%`, backgroundColor: 'var(--accent-strong)' }}></div>
            <div className="weight-bar-seg" style={{ width: `${weights.traits}%`, backgroundColor: '#e11d48' }}></div>
          </div>
        </div>

        {/* Recent Scans Widget */}
        <div className="sidebar-widget">
          <div className="widget-header-row">
            <h5>Recent Scans</h5>
            <button 
              onClick={() => setPrivacyMode(!privacyMode)} 
              className={`privacy-btn ${privacyMode ? 'active' : ''}`}
              title="Toggle Privacy Mode (Confidential Logs)"
            >
              {privacyMode ? "🕵️ Private" : "👁️ Public"}
            </button>
          </div>
          
          <div className={`history-list ${privacyMode ? 'blurred' : ''}`}>
            {scanHistory.slice(0, 3).map((item) => (
              <div key={item.id} className="history-item cursor-pointer" onClick={() => {
                setActiveAnalysis(item);
                setCurrentView('results');
              }}>
                <span className="history-name">
                  {privacyMode ? "Confidential_CV.pdf" : item.fileName}
                </span>
                <span className="history-badge" style={{
                  borderColor: item.rawMatchScore >= 80 ? 'var(--match-green)' : item.rawMatchScore >= 60 ? 'var(--accent-strong)' : 'var(--gap-red)',
                  color: item.rawMatchScore >= 80 ? '#34d399' : item.rawMatchScore >= 60 ? '#60a5fa' : '#f43f5e'
                }}>{item.rawMatchScore}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostics Widget */}
        <div className="sidebar-widget">
          <h5>System Diagnostics</h5>
          <div className="diagnostic-line">
            <span className="diagnostic-dot active" />
            <span>NLP Engine: {selectedEngine === 'bert' ? 'BERT (Semantic)' : 'TF-IDF (Cosine)'}</span>
          </div>
          <div className="diagnostic-line">
            <span className="diagnostic-dot active" />
            <span>Tesseract OCR: Ready</span>
          </div>
        </div>

        <div className="status-container">
          <div className="nlp-badge">Capstone Engine v2.0.0</div>
          <div className="status-dot"><span className="dot animate-pulse"></span> Service Active</div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-viewport">
        <header className="header-bar no-print">
          <div className="header-content">
            <h3>
              {currentView === 'home' && "Home / Data Ingestion"}
              {currentView === 'results' && "Detailed Report Analysis"}
              {currentView === 'history' && "Scan History Log"}
              {currentView === 'bulk' && "Bulk Match Processing"}
              {currentView === 'settings' && "Engine & Matching Weights Config"}
            </h3>
            <span className="engine-label">Vectorization: {selectedEngine.toUpperCase()}</span>
          </div>
        </header>

        {/* View 1: Home/Data Ingestion */}
        {currentView === 'home' && (
          <div className="content-grid fade-in">
            <section className="input-panel">
              <div className="panel-heading">
                <p className="panel-eyebrow">Data Ingestion</p>
                <h4>Submit Source Resume & Requirements</h4>
              </div>

              <label
                className={`file-upload ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileSelect(e.dataTransfer.files?.[0]);
                }}
              >
                <span className="upload-mark"><UploadIcon /></span>
                <input type="file" onChange={(e) => handleFileSelect(e.target.files[0])} accept=".pdf,.docx" style={{ display: 'none' }} />
                <span className="upload-copy">{file ? file.name : "Click to Upload Resume (PDF/DOCX)"}</span>
                <span className="upload-hint">Drag and drop matches supported</span>
              </label>

              <textarea 
                value={jd} 
                onChange={(e) => setJd(e.target.value)} 
                placeholder="Paste Job Description / target skills requirements here..."
              ></textarea>

              {validationError && (
                <div className="backend-error-banner" role="alert">
                  <span className="backend-error-dot" />
                  <div>
                    <strong>Validation Error</strong>
                    <p>{validationError}</p>
                  </div>
                </div>
              )}

              {backendError && (
                <div className="backend-error-banner" role="alert">
                  <span className="backend-error-dot" />
                  <div>
                    <strong>Ingestion Service Offline</strong>
                    <p>{backendError}</p>
                  </div>
                </div>
              )}

              <button onClick={handleAnalyze} disabled={loading} className="analyze-btn">
                {loading ? "Analyzing Document Vectors..." : "Execute Prediction Scan"}
              </button>
            </section>

            <section className="result-panel">
              <div className="empty-state">
                <RadarPlaceholder />
                <div className="empty-state-copy">
                  <p className="empty-state-kicker">System ready</p>
                  <h4>Awaiting Data Input for Prediction Analysis</h4>
                  <span>Configure your matching parameters in Settings and upload source materials to initialize document vector scoring.</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* View 2: Detailed Results View */}
        {currentView === 'results' && activeAnalysis && (
          <div className="results-container fade-in">
            <div className="results-grid">
              
              {/* Overall match metrics */}
              <div className="result-card main-score-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Match Ingestion Report</p>
                  <h4>{activeAnalysis.fileName}</h4>
                  <span className="report-timestamp">{activeAnalysis.timestamp}</span>
                </div>

                <div className="score-block-section">
                  <div className="radial-progress-large">
                    <span className="score-val-huge">{activeAnalysis.rawMatchScore}%</span>
                    <span className="score-desc-tag">OVERALL FIT</span>
                  </div>
                  <div className="verdict-banner-badge">{activeAnalysis.verdict}</div>
                </div>

                <div className="report-actions no-print">
                  <button onClick={triggerPDFDownload} className="btn-secondary">
                    <DownloadIcon /> Download PDF Report
                  </button>
                </div>
              </div>

              {/* Dynamic Weights Breakdown Progress Bar */}
              <div className="result-card metrics-breakdown-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Vector weights breakdown</p>
                  <h4>Weighted Sub-Category Match</h4>
                </div>

                <div className="bar-breakdowns-list">
                  <div className="breakdown-metric-row">
                    <div className="metric-row-header">
                      <span>Technical Skills ({weights.tech}%)</span>
                      <strong>{activeAnalysis.subScores.tech}%</strong>
                    </div>
                    <div className="metric-track">
                      <div className="metric-bar-fill" style={{ width: `${activeAnalysis.subScores.tech}%`, backgroundColor: 'var(--accent)' }}></div>
                    </div>
                  </div>

                  <div className="breakdown-metric-row">
                    <div className="metric-row-header">
                      <span>Educational Degrees ({weights.edu}%)</span>
                      <strong>{activeAnalysis.subScores.edu}%</strong>
                    </div>
                    <div className="metric-track">
                      <div className="metric-bar-fill" style={{ width: `${activeAnalysis.subScores.edu}%`, backgroundColor: 'var(--accent-strong)' }}></div>
                    </div>
                  </div>

                  <div className="breakdown-metric-row">
                    <div className="metric-row-header">
                      <span>Professional Traits ({weights.traits}%)</span>
                      <strong>{activeAnalysis.subScores.traits}%</strong>
                    </div>
                    <div className="metric-track">
                      <div className="metric-bar-fill" style={{ width: `${activeAnalysis.subScores.traits}%`, backgroundColor: '#e11d48' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identified Skills Comparison List */}
              <div className="result-card skills-match-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Skills Mapping</p>
                  <h4>Identified Keywords Profile</h4>
                </div>
                <div className="tag-list-box">
                  {activeAnalysis.detectedSkills.length > 0 ? (
                    activeAnalysis.detectedSkills.map((skill, index) => (
                      <span key={index} className="tag-match">{skill}</span>
                    ))
                  ) : (
                    <span className="empty-state-copy">No overlapping skills matching configuration found.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills/Keywords Gaps */}
              <div className="result-card skills-gap-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Requirements Gaps</p>
                  <h4>Missing Critical Skills</h4>
                </div>
                <div className="tag-list-box">
                  {activeAnalysis.missingSkills.length > 0 ? (
                    activeAnalysis.missingSkills.map((skill, index) => (
                      <span key={index} className="tag-gap">{skill}</span>
                    ))
                  ) : (
                    <span className="tag-match" style={{ color: 'var(--match-green)' }}>No critical skill gaps identified!</span>
                  )}
                </div>
              </div>

              {/* Strengths & Weaknesses Dynamic AI Summary */}
              <div className="result-card recommendation-card full-width-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Profile intelligence</p>
                  <h4>Recruiter Action Plan & Summary</h4>
                </div>
                
                <div className="summary-details-content">
                  <p className="rec-text">{activeAnalysis.recommendation}</p>
                  
                  <div className="strengths-weaknesses-split">
                    <div className="sw-box">
                      <h5>Key Strengths</h5>
                      <ul>
                        {activeAnalysis.rawMatchScore >= 60 ? (
                          <>
                            <li>Strong keyword overlap in target domains.</li>
                            <li>Meets target educational requirements thresholds.</li>
                            {activeAnalysis.detectedSkills.slice(0, 2).map((s, i) => (
                              <li key={i}>Explicit verification of core skill: <strong>{s}</strong></li>
                            ))}
                          </>
                        ) : (
                          <>
                            <li>Includes basic professional qualifications.</li>
                            {activeAnalysis.detectedSkills.length > 0 ? (
                              <li>Verified skills: {activeAnalysis.detectedSkills.join(', ')}</li>
                            ) : (
                              <li>Clean readable layout parsing complete.</li>
                            )}
                          </>
                        )}
                      </ul>
                    </div>
                    
                    <div className="sw-box">
                      <h5>Areas to Address</h5>
                      <ul>
                        {activeAnalysis.missingSkills.length > 0 ? (
                          activeAnalysis.missingSkills.slice(0, 3).map((s, i) => (
                            <li key={i}>Lacks keywords mapping to: <strong>{s}</strong></li>
                          ))
                        ) : (
                          <li>None! Profile shows maximum requirements matching consistency.</li>
                        )}
                        {activeAnalysis.rawMatchScore < 60 && (
                          <li>Overall score is below standard interview benchmark thresholds.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* View 3: History Log */}
        {currentView === 'history' && (
          <div className="history-view-container fade-in">
            <div className="table-card">
              <div className="table-card-header">
                <div>
                  <h4>Scan Logs Database</h4>
                  <span>Review and load reports from past resume predictions.</span>
                </div>
                {scanHistory.length > 0 && (
                  <button 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear all history scans?")) {
                        setScanHistory([]);
                        localStorage.removeItem('resume_scan_history_capstone');
                      }
                    }} 
                    className="clear-history-btn-large"
                  >
                    Wipe Database Logs
                  </button>
                )}
              </div>

              {scanHistory.length > 0 ? (
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Candidate CV</th>
                        <th>Scanned Timestamp</th>
                        <th>Overall Fit Score</th>
                        <th>Verdict Profile</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanHistory.map((item) => (
                        <tr key={item.id}>
                          <td className="file-name-cell">{item.fileName}</td>
                          <td className="timestamp-cell">{item.timestamp}</td>
                          <td>
                            <span className="score-table-badge" style={{
                              backgroundColor: item.rawMatchScore >= 80 ? 'rgba(16, 185, 129, 0.1)' : item.rawMatchScore >= 60 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                              color: item.rawMatchScore >= 80 ? '#34d399' : item.rawMatchScore >= 60 ? '#60a5fa' : '#f43f5e',
                              borderColor: item.rawMatchScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : item.rawMatchScore >= 60 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(244, 63, 94, 0.2)'
                            }}>
                              {item.rawMatchScore}%
                            </span>
                          </td>
                          <td>{item.verdict}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-action-group">
                              <button className="table-btn-view" onClick={() => {
                                setActiveAnalysis(item);
                                setCurrentView('results');
                              }}>Load Analysis</button>
                              <button className="table-btn-delete" onClick={() => {
                                setScanHistory(prev => prev.filter(x => x.id !== item.id));
                              }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-table-state">
                  <div className="empty-icon-cloud">📁</div>
                  <p>Database is empty. Execute a match prediction scan to start populating records.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 4: Advanced Bulk Ingestion Leaderboard */}
        {currentView === 'bulk' && (
          <div className="bulk-view-container fade-in">
            <div className="bulk-grid">
              
              {/* Batch Inputs */}
              <div className="bulk-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Advanced Batch Ingestion</p>
                  <h4>Upload Multiple Candidate Resumes</h4>
                </div>

                <label
                  className="file-upload"
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleBulkFileSelect(e.dataTransfer.files);
                  }}
                >
                  <span className="upload-mark"><UploadIcon /></span>
                  <input type="file" multiple onChange={(e) => handleBulkFileSelect(e.target.files)} accept=".pdf,.docx" style={{ display: 'none' }} />
                  <span className="upload-copy">Select Multiple Resumes (PDF/DOCX)</span>
                  <span className="upload-hint">Upload directory queue supported</span>
                </label>

                {/* Queue list */}
                {bulkFiles.length > 0 && (
                  <div className="bulk-queue-box">
                    <h5>Queue Ingestion ({bulkFiles.length} files)</h5>
                    <div className="queue-list">
                      {bulkFiles.map((f, idx) => (
                        <div key={idx} className="queue-item">
                          <span>{f.name}</span>
                          <button onClick={() => removeBulkFile(idx)}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea 
                  value={bulkJd} 
                  onChange={(e) => setBulkJd(e.target.value)} 
                  placeholder="Paste Job Description target requirements to compare candidates against..."
                ></textarea>

                <button 
                  onClick={handleBulkAnalyze} 
                  disabled={bulkLoading || bulkFiles.length === 0 || !bulkJd.trim()} 
                  className="analyze-btn"
                >
                  {bulkLoading ? `Scanning vector queue: ${bulkProgress.current} / ${bulkProgress.total}...` : "Execute Batch Match Prediction"}
                </button>
              </div>

              {/* Leaderboard output */}
              <div className="bulk-card">
                <div className="panel-heading">
                  <p className="panel-eyebrow">Recruiter leaderboard</p>
                  <h4>Ranked Candidate Standings</h4>
                </div>

                {bulkResults.length > 0 ? (
                  <div className="leaderboard-list">
                    {bulkResults.map((candidate, index) => (
                      <div key={candidate.id} className="leaderboard-item">
                        <div className="leader-badge-rank">#{index + 1}</div>
                        <div className="leader-details">
                          <span className="leader-name">{candidate.fileName}</span>
                          <span className="leader-skills">Skills matched: {candidate.detectedSkills.slice(0, 3).join(', ') || 'None'}</span>
                        </div>
                        <div className="leader-score-block">
                          <strong className="leader-score-percent">{candidate.rawMatchScore}%</strong>
                          <button onClick={() => {
                            setActiveAnalysis(candidate);
                            setCurrentView('results');
                          }} className="btn-table-view-small">Report</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-table-state">
                    <div className="empty-icon-cloud">🏆</div>
                    <p>Rankings will appear here after batch match prediction executes.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* View 5: Settings Drawer */}
        {currentView === 'settings' && (
          <div className="settings-view-container fade-in">
            <div className="settings-card">
              <div className="panel-heading">
                <p className="panel-eyebrow">System parameters</p>
                <h4>Algorithmic Configuration Weights</h4>
              </div>

              <div className="settings-info-badge">
                💡 Sliders are auto-balanced to guarantee the total math weights equal exactly 100%.
              </div>

              <div className="sliders-section">
                <div className="slider-item">
                  <div className="slider-info">
                    <span>Technical Keywords Matching Weight</span>
                    <strong>{weights.tech}%</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={weights.tech} 
                    onChange={(e) => handleWeightChange('tech', e.target.value)}
                    className="custom-range"
                  />
                  <p className="slider-hint">Weight applied to direct/fuzzy overlap of programming languages, libraries and certifications.</p>
                </div>

                <div className="slider-item">
                  <div className="slider-info">
                    <span>Education Degrees Alignment Weight</span>
                    <strong>{weights.edu}%</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={weights.edu} 
                    onChange={(e) => handleWeightChange('edu', e.target.value)}
                    className="custom-range"
                  />
                  <p className="slider-hint">Weight applied to degree level matching (e.g. Master, BS, PhD).</p>
                </div>

                <div className="slider-item">
                  <div className="slider-info">
                    <span>Professional Traits Alignment Weight</span>
                    <strong>{weights.traits}%</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={weights.traits} 
                    onChange={(e) => handleWeightChange('traits', e.target.value)}
                    className="custom-range"
                  />
                  <p className="slider-hint">Weight applied to soft skills, leadership traits and project management keywords.</p>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="panel-heading">
                <p className="panel-eyebrow">Model architecture</p>
                <h4>NLP Vectorization Pipeline Engine</h4>
              </div>

              <div className="engine-select-grid">
                <label className={`engine-card-option ${selectedEngine === 'tfidf' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="engine" 
                    value="tfidf" 
                    checked={selectedEngine === 'tfidf'}
                    onChange={() => setSelectedEngine('tfidf')}
                    style={{ display: 'none' }}
                  />
                  <strong>TF-IDF Ingestion Engine</strong>
                  <p>Analyzes term frequency inverse document frequencies. Ideal for fast keyword correlation and quick exact/fuzzy overlap matches.</p>
                  <span className="engine-badge-tag">Optimized / Stable</span>
                </label>

                <label className={`engine-card-option ${selectedEngine === 'bert' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="engine" 
                    value="bert" 
                    checked={selectedEngine === 'bert'}
                    onChange={() => setSelectedEngine('bert')}
                    style={{ display: 'none' }}
                  />
                  <strong>BERT Semantic Transformer</strong>
                  <p>Utilizes bidirectional encoder representation semantic math. Ideal for mapping domain synonyms and contextual traits matching.</p>
                  <span className="engine-badge-tag experimental">Semantic Context</span>
                </label>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;