'use client';
import { useState, useEffect } from 'react';
import { generateAIInsights } from '@/lib/aiIntegration';

export default function AIInsights({ analysis, metrics, fileName }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        const result = await generateAIInsights(analysis, metrics, fileName);
        setInsights(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (analysis && metrics) {
      fetchInsights();
    }
  }, [analysis, metrics, fileName]);

  if (loading) {
    return <div className="ai-insights-loading">🤖 Generating AI insights...</div>;
  }

  if (error || insights?.error) {
    return (
      <div className="ai-insights-error">
        ⚠️ {error || insights.error}
        <p className="small">AI insights temporarily unavailable</p>
      </div>
    );
  }

  return (
    <div className="ai-insights-panel">
      <h3>✨ AI-Powered Insights</h3>

      <div className="ai-summary">{insights?.summary}</div>

      {insights?.recommendations && insights.recommendations.length > 0 && (
        <div className="ai-recommendations">
          <h4>Top Recommendations:</h4>
          <ul>
            {insights.recommendations.slice(0, 5).map((rec, idx) => (
              <li key={idx}>
                <strong>{rec.title}</strong>: {rec.description}
                <div className="impact-badge">{rec.impact}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
