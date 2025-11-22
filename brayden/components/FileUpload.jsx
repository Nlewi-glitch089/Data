"use client"
import React, { useState, useRef } from 'react'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'
import { parseFile } from '../lib/fileProcessing'

export default function FileUpload(){
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filename, setFilename] = useState('')
  const inputRef = useRef(null)
  const router = useRouter()

  async function handleFile(file){
    setLoading(true)
    setFilename(file.name)
    try{
      const data = await parseFile(file, { Papa })
      // Save parsed dataset to sessionStorage as required
      sessionStorage.setItem('dataset', JSON.stringify(data))
      sessionStorage.setItem('datasetName', file.name)
      // allow preview page to compute previewStats
      router.push('/preview')
    }catch(err){
      console.error('Parsing error', err)
      alert('Failed to parse file: '+err.message)
    }finally{
      setLoading(false)
    }
  }

  function onDrop(e){
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files && e.dataTransfer.files[0]
    if(f) handleFile(f)
  }

  function onSelect(e){
    const f = e.target.files && e.target.files[0]
    if(f) handleFile(f)
  }

  return (
    <div>
      <div
        className={"dropzone" + (dragOver? ' dragover':'')}
        onDragOver={(e)=>{e.preventDefault();setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={onDrop}
        onClick={()=>inputRef.current && inputRef.current.click()}
        role="button"
        tabIndex={0}
      >
        <p>{loading ? 'Parsing file...' : 'Drag & Drop File Here or Click to Choose'}</p>
        <input ref={inputRef} type="file" accept=".csv,.json,.xls,.xlsx" onChange={onSelect} style={{display:'none'}} />
      </div>

      <div className="controls">
        <div className="filemeta">{filename ? `Selected: ${filename}` : ''}</div>
        {loading ? <div className="filemeta">Analyzing…</div> : null}
      </div>
    </div>
  )
}
