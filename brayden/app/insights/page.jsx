'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ColumnDetails from '@/components/ColumnDetails';
import { generateAIInsights } from '@/lib/aiIntegration';

export default function InsightsPage() {
  const [analysis, setAnalysis] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem('analysis');
    const storedMetrics = sessionStorage.getItem('metrics');
    const storedFileName = sessionStorage.getItem('fileName');

    if (!storedAnalysis) {
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(storedAnalysis);
      const metricsData = JSON.parse(storedMetrics);
      setAnalysis(parsed);
      setMetrics(metricsData);
      setFileName(storedFileName || 'dataset');

      // Fetch AI insights
      generateAIInsights(parsed, metricsData, storedFileName).then(setAiInsights);
    } catch (err) {
      console.error('Error loading insights:', err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return <div className="insights-page"><div className="loading">Loading detailed insights...</div></div>;
  }

  return (
    <div className="insights-page">
      <section className="insights-header">
        <h2>Detailed Column Analysis</h2>
        <p>{fileName}</p>
      </section>

      {analysis && (
        <div className="columns-accordion">
          {Object.values(analysis.columns).map((col) => (
            <ColumnDetails
              key={col.columnName}
              columnAnalysis={col}
              columnInsights={aiInsights?.columnInsights?.[col.columnName]}
            />
          ))}
        </div>
      )}

      <div className="button-group">
        <button className="btn-primary" onClick={() => router.push('/')}>
          Upload New Dataset
        </button>
      </div>
    </div>
  );
}
