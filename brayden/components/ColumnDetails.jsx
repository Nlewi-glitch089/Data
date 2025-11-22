'use client';
import { useState } from 'react';
import { getColumnRecommendations } from '@/lib/aiIntegration';

export default function ColumnDetails({ columnAnalysis, columnInsights }) {
  const [expanded, setExpanded] = useState(false);
  const recommendations = getColumnRecommendations(columnAnalysis);

  return (
    <div className="column-details">
      <button
        className="column-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="column-name">{columnAnalysis.columnName}</span>
        <span className="column-type">{columnAnalysis.dataType}</span>
        <span className="column-issues">
          {columnAnalysis.missingCount + columnAnalysis.duplicateCount + columnAnalysis.outliersCount} issues
        </span>
        <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="column-content">
          <div className="stat-grid">
            <div className="stat">
              <label>Missing Values</label>
              <span>{columnAnalysis.missingCount} ({columnAnalysis.missingPercent}%)</span>
            </div>
            <div className="stat">
              <label>Duplicates</label>
              <span>{columnAnalysis.duplicateCount} ({columnAnalysis.duplicatePercent}%)</span>
            </div>
            <div className="stat">
              <label>Outliers</label>
              <span>{columnAnalysis.outliersCount} ({columnAnalysis.outliersPercent}%)</span>
            </div>
            <div className="stat">
              <label>Unique Values</label>
              <span>{columnAnalysis.uniqueCount} ({columnAnalysis.uniquePercent}%)</span>
            </div>
          </div>

          {columnInsights && (
            <div className="insights">
              <h5>Analysis:</h5>
              <p>{columnInsights.missingIssue}</p>
              <p>{columnInsights.duplicateIssue}</p>
              <p>{columnInsights.outlierIssue}</p>
              <p>{columnInsights.formatIssue}</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="recommendations">
              <h5>Recommendations:</h5>
              {recommendations.map((rec, idx) => (
                <div key={idx} className="rec-item">
                  <strong>{rec.message}</strong>
                  <ul>
                    {rec.actions.map((action, aidx) => (
                      <li key={aidx}>{action}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
