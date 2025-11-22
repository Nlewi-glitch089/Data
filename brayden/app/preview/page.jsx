"use client";
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DataPreview from '@/components/DataPreview'
import { analyzeDataset } from '@/lib/dataAnalysis'

export default function PreviewPage(){
  const [dataset, setDataset] = useState(null)
  const [fileName, setFileName] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(()=>{
    const stored = sessionStorage.getItem('dataset')
    const storedFileName = sessionStorage.getItem('fileName')

    if(!stored){
      router.push('/')
      return
    }

    try{
      const parsed = JSON.parse(stored)
      setDataset(parsed)
      setFileName(storedFileName || 'dataset.csv')

      // Analyze dataset
      const analysisResult = analyzeDataset(parsed)
      setAnalysis(analysisResult)
      sessionStorage.setItem('analysis', JSON.stringify(analysisResult))
    }catch(err){
      console.error('Error loading data:', err)
      router.push('/')
    }finally{
      setLoading(false)
    }
  },[router])

  if(loading){
    return (
      <div className="preview-page">
        <div className="loading-spinner">Loading data preview...</div>
      </div>
    )
  }

  return (
    <div className="preview-page">
      <section className="preview-header">
        <h2>Data Preview</h2>
        <p className="file-info">{fileName}</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '100%' }} />
        </div>
        <p className="progress-text">Analysis Complete</p>
      </section>

      {dataset && <DataPreview data={dataset.slice(0, 100)} />}

      {analysis && (
        <section className="column-stats">
          <h3>Column Statistics</h3>
          <div className="stats-grid">
            {Object.values(analysis.columns).map((col) => (
              <div key={col.columnName} className="stat-card">
                <h4>{col.columnName}</h4>
                <p><strong>Type:</strong> {col.dataType}</p>
                <p><strong>Missing:</strong> {col.missingCount} ({col.missingPercent}%)</p>
                <p><strong>Unique:</strong> {col.uniqueCount}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="button-group">
        <button className="btn-primary" onClick={() => router.push('/dashboard')}>
          View Dashboard →
        </button>
      </div>
    </div>
  )
}
