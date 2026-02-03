import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Use empty string to use the proxy (configured in package.json)
// Or set to 'http://localhost:8080' if running without proxy
const API_BASE_URL = '';

function App() {
  // Text Analysis State
  const [textInput, setTextInput] = useState('');
  const [textResult, setTextResult] = useState(null);
  const [textLoading, setTextLoading] = useState(false);

  // News Sentiment State
  const [keyword, setKeyword] = useState('technology');
  const [timeWindow, setTimeWindow] = useState(3);
  const [newsResults, setNewsResults] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef(null);

  // Analyze single text
  const analyzeText = async () => {
    if (!textInput.trim()) return;

    setTextLoading(true);
    setTextResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/hello?text=${encodeURIComponent(textInput)}`);
      const result = await response.text();
      const scoreMatch = result.match(/Score is:(\d+\.?\d*)/);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
      setTextResult({ raw: result, score });
    } catch (error) {
      setTextResult({ error: error.message });
    } finally {
      setTextLoading(false);
    }
  };

  // Start news sentiment stream
  const startNewsStream = async () => {
    setNewsResults([]);
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${API_BASE_URL}/sentiment?text=${encodeURIComponent(keyword)}&timeWindowSec=${timeWindow}`,
        { signal: abortControllerRef.current.signal }
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('<br>').filter(line => line.trim());

        lines.forEach(line => {
          const match = line.match(/(\d+) messages, sentiment = ([\d.]+)/);
          if (match) {
            const messageCount = parseInt(match[1]);
            const sentiment = parseFloat(match[2]);
            setNewsResults(prev => [...prev, {
              timestamp: new Date().toLocaleTimeString(),
              messageCount,
              sentiment,
              raw: line
            }]);
          }
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Stream error:', error);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  // Stop news stream
  const stopNewsStream = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    try {
      await fetch(`${API_BASE_URL}/stopNews`);
    } catch (error) {
      console.error('Stop error:', error);
    }
    setIsStreaming(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Get sentiment color and label
  const getSentimentInfo = (score) => {
    if (score >= 4) return { color: '#22c55e', label: 'Positive', emoji: '😊' };
    if (score >= 3) return { color: '#eab308', label: 'Neutral', emoji: '😐' };
    if (score >= 2) return { color: '#f97316', label: 'Negative', emoji: '😞' };
    return { color: '#ef4444', label: 'Very Negative', emoji: '😢' };
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Sentiment Analyzer</h1>
        <p>Real-time news sentiment analysis powered by Stanford NLP</p>
      </header>

      <main className="main">
        {/* Text Analysis Section */}
        <section className="card">
          <h2>Text Sentiment Analysis</h2>
          <p className="section-desc">Enter any text to analyze its sentiment</p>

          <div className="input-group">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to analyze (e.g., 'I love this product!' or 'This is terrible.')"
              rows={4}
            />
            <button
              onClick={analyzeText}
              disabled={textLoading || !textInput.trim()}
              className="btn primary"
            >
              {textLoading ? 'Analyzing...' : 'Analyze Sentiment'}
            </button>
          </div>

          {textResult && (
            <div className="result">
              {textResult.error ? (
                <div className="error">Error: {textResult.error}</div>
              ) : textResult.score ? (
                <div className="sentiment-result">
                  <div
                    className="sentiment-score"
                    style={{ backgroundColor: getSentimentInfo(textResult.score).color }}
                  >
                    <span className="emoji">{getSentimentInfo(textResult.score).emoji}</span>
                    <span className="score">{textResult.score.toFixed(1)}/5</span>
                  </div>
                  <div className="sentiment-label">
                    {getSentimentInfo(textResult.score).label}
                  </div>
                </div>
              ) : (
                <div>{textResult.raw}</div>
              )}
            </div>
          )}
        </section>

        {/* News Sentiment Stream Section */}
        <section className="card">
          <h2>Live News Sentiment Stream</h2>
          <p className="section-desc">Stream real-time sentiment analysis of news articles</p>

          <div className="controls">
            <div className="control-group">
              <label>Keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., technology, bitcoin, climate"
                disabled={isStreaming}
              />
            </div>
            <div className="control-group">
              <label>Time Window (seconds)</label>
              <input
                type="number"
                value={timeWindow}
                onChange={(e) => setTimeWindow(parseInt(e.target.value) || 3)}
                min={1}
                max={60}
                disabled={isStreaming}
              />
            </div>
            <div className="control-group buttons">
              {!isStreaming ? (
                <button onClick={startNewsStream} className="btn primary">
                  Start Stream
                </button>
              ) : (
                <button onClick={stopNewsStream} className="btn danger">
                  Stop Stream
                </button>
              )}
            </div>
          </div>

          {isStreaming && (
            <div className="streaming-indicator">
              <div className="pulse"></div>
              <span>Streaming news for "{keyword}"...</span>
            </div>
          )}

          {newsResults.length > 0 && (
            <div className="news-results">
              <h3>Sentiment Timeline</h3>
              <div className="timeline">
                {newsResults.slice(-20).map((result, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-time">{result.timestamp}</div>
                    <div
                      className="timeline-bar"
                      style={{
                        width: `${(result.sentiment / 5) * 100}%`,
                        backgroundColor: getSentimentInfo(result.sentiment).color
                      }}
                    >
                      <span className="bar-label">
                        {result.messageCount} articles | Sentiment: {result.sentiment.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {newsResults.length > 0 && (
                <div className="average-sentiment">
                  <h4>Average Sentiment</h4>
                  <div
                    className="avg-score"
                    style={{
                      backgroundColor: getSentimentInfo(
                        newsResults.reduce((a, b) => a + b.sentiment, 0) / newsResults.length
                      ).color
                    }}
                  >
                    {(newsResults.reduce((a, b) => a + b.sentiment, 0) / newsResults.length).toFixed(2)}/5
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Powered by Spring WebFlux, Apache Kafka & Stanford CoreNLP</p>
      </footer>
    </div>
  );
}

export default App;
