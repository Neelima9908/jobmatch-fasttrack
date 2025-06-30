import React, { useState } from 'react';
import './App.css';
import Lottie from 'lottie-react';
import uploadAnimation from './animations/upload.json';

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [sortBy, setSortBy] = useState('desc');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('❌ Please select a PDF file');
      return;
    }

    setLoading(true);
    setMessage('');
    setResult(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: formData
      });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Server did not return JSON');
      }

      console.log('Server response:', data);

      if (res.ok) {
        setResult(data);
        setMessage('✅ Resume processed successfully');
      } else {
        setMessage(`❌ Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage('❌ Error uploading file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortedMatches = result?.matches
    ? [...result.matches].sort((a, b) => {
        return sortBy === 'asc'
          ? a.similarity_score - b.similarity_score
          : b.similarity_score - a.similarity_score;
      })
    : [];

  return (
    <div className={`container ${darkMode ? 'dark' : 'light'}`}>
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
      </button>

      <div className="main">
        <div className="animation-wrapper">
          <Lottie animationData={uploadAnimation} loop={true} className="lottie" />
        </div>

        <h1>📄 Upload Resume (PDF)</h1>

        <form onSubmit={handleSubmit}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        {result && (
          <div className="result-section-wrapper">
            <h2>📄 Candidate Summary</h2>
            <div className="result-scroll-container">
              <div className="resume-info-grid">
                <div><strong>Name:</strong> {result.resume.name || 'N/A'}</div>
                <div><strong>Email:</strong> {result.resume.email || 'N/A'}</div>
                <div><strong>Phone:</strong> {result.resume.phone || 'N/A'}</div>
                <div>
                  <strong>Top Skills:</strong>
                  {result.resume.skills?.slice(0, 5).join(', ') || 'N/A'}
                </div>
                <div>
                  <strong>Profile:</strong>
                  {result.resume.skills?.includes('Python') ? 'Tech / Developer' : 'General'}
                </div>
              </div>

              <div className="filter-sort">
                <label>Sort by Similarity: </label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
              </div>

              <h2>🎯 Top Job Matches</h2>
              <div className="job-matches-scroll">
                {sortedMatches.map((match, idx) => (
                  <div className="job-card" key={idx}>
                    <h3>{match.job_id}</h3>
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{ width: `${match.similarity_score}%` }}
                      >
                        {match.similarity_score}%
                      </div>
                    </div>
                    <p><strong>Matched Skills:</strong> {match.matched_skills.join(', ') || 'None'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
