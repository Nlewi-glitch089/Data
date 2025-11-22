'use client';
import { getScoreColor } from '@/lib/qualityMetrics';

export default function QualityScore({ metrics }) {
  if (!metrics) return <div>Loading metrics...</div>;

  const scoreColor = getScoreColor(metrics.compositeScore);

  return (
    <div className="quality-score-container">
      <div className="score-display" style={{ borderColor: scoreColor }}>
        <div className="score-number" style={{ color: scoreColor }}>
          {metrics.compositeScore}
        </div>
        <div className="score-level" style={{ color: scoreColor }}>
          {metrics.scoreLevel}
        </div>
        <div className="score-summary">{metrics.summary}</div>
      </div>

      <div className="metrics-breakdown">
        <div className="metric-item">
          <span className="metric-label">Completeness</span>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${metrics.completeness}%`,
                backgroundColor: '#3b82f6',
              }}
            />
          </div>
          <span className="metric-value">{metrics.completeness}%</span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Consistency</span>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${metrics.consistency}%`,
                backgroundColor: '#10b981',
              }}
            />
          </div>
          <span className="metric-value">{metrics.consistency}%</span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Accuracy</span>
          <div className="metric-bar">
            <div
              className="metric-fill"
              style={{
                width: `${metrics.accuracy}%`,
                backgroundColor: '#f59e0b',
              }}
            />
          </div>
          <span className="metric-value">{metrics.accuracy}%</span>
        </div>
      </div>
    </div>
  );
}
