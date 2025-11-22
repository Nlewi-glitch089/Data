"use client"
import React from 'react'

export default function DataPreview({ data, maxRows = 100 }){
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="preview-empty">No data to preview</div>;
  }

  const columns = Object.keys(data[0])
  const rows = data.slice(0, maxRows)

  return (
    <div className="data-preview">
      <div className="preview-info">
        Showing {rows.length} of {data.length} rows
      </div>
      <div className="table-wrapper">
        <table className="preview-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={`${idx}-${col}`} title={String(row[col] || '')}>
                    {row[col] === null || row[col] === undefined ? (
                      <span className="null-value">NULL</span>
                    ) : (
                      String(row[col]).slice(0, 50)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
