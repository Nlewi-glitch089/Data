'use client';
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { getMetricChartData } from '@/lib/qualityMetrics';
import { getDataTypeDistribution } from '@/lib/dataAnalysis';

export function MetricsChart({ metrics }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !metrics) return;

    const ctx = canvasRef.current.getContext('2d');
    const data = getMetricChartData(metrics);

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: 'Quality Score (%)',
            data: data.map((d) => d.value),
            backgroundColor: data.map((d) => d.color),
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Quality Metrics' },
        },
        scales: {
          x: { min: 0, max: 100 },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [metrics]);

  return <canvas ref={canvasRef} style={{ maxWidth: '100%', height: '250px' }} />;
}

export function DataTypeChart({ analysis }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !analysis) return;

    const ctx = canvasRef.current.getContext('2d');
    const distribution = getDataTypeDistribution(analysis);
    const labels = Object.keys(distribution);
    const values = Object.values(distribution);

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              '#3b82f6',
              '#10b981',
              '#f59e0b',
              '#ef4444',
              '#8b5cf6',
              '#ec4899',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Data Types Distribution' },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [analysis]);

  return <canvas ref={canvasRef} style={{ maxWidth: '100%', height: '250px' }} />;
}

export function ColumnIssuesChart({ columnIssues }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !columnIssues || columnIssues.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    const top10 = columnIssues.slice(0, 10);

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top10.map((col) => col.columnName),
        datasets: [
          {
            label: 'Issue Count',
            data: top10.map((col) => col.issueCount),
            backgroundColor: '#ef4444',
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Top 10 Columns with Issues' },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [columnIssues]);

  return <canvas ref={canvasRef} style={{ maxWidth: '100%', height: '300px' }} />;
}
