'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QualityScore from '@/components/QualityScore';
import { MetricsChart, DataTypeChart, ColumnIssuesChart } from '@/components/DataVisualizations';
import AIInsights from '@/components/AIInsights';
import { calculateQualityMetrics } from '@/lib/qualityMetrics';
import { getColumnIssues } from '@/lib/dataAnalysis';

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [columnIssues, setColumnIssues] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('analysis');
    const storedFileName = sessionStorage.getItem('fileName');

    if (!stored) {
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setAnalysis(parsed);
      setFileName(storedFileName || 'dataset');

      const metricsResult = calculateQualityMetrics(parsed);
      setMetrics(metricsResult);
      sessionStorage.setItem('metrics', JSON.stringify(metricsResult));

      const issues = getColumnIssues(parsed);
      setColumnIssues(issues);
    } catch (err) {
      console.error('Error loading analysis:', err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return <div className="dashboard-page"><div className="loading">Loading dashboard...</div></div>;
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <h2>Quality Analysis Dashboard</h2>
        <p>{fileName}</p>
      </section>

      {metrics && <QualityScore metrics={metrics} />}

      <div className="charts-grid">
        {metrics && <MetricsChart metrics={metrics} />}
        {analysis && <DataTypeChart analysis={analysis} />}
        {columnIssues.length > 0 && <ColumnIssuesChart columnIssues={columnIssues} />}
      </div>

      {analysis && metrics && (
        <AIInsights analysis={analysis} metrics={metrics} fileName={fileName} />
      )}

      {columnIssues.length > 0 && (
        <section className="column-issues-table">
          <h3>Columns with Issues</h3>
          <table>
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Missing</th>
                <th>Duplicates</th>
                <th>Outliers</th>
              </tr>
            </thead>
            <tbody>
              {columnIssues.slice(0, 10).map((col) => (
                <tr key={col.columnName}>
                  <td>{col.columnName}</td>
                  <td>{col.dataType}</td>
                  <td>{col.missingCount}</td>
                  <td>{col.duplicateCount}</td>
                  <td>{col.outliersCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="button-group">
        <button className="btn-primary" onClick={() => router.push('/insights')}>
          View Detailed Insights →
        </button>
      </div>
    </div>
  );
}
