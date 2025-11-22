"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseFile } from "@/lib/fileProcessing";

export default function UploadPage() {
  const fileRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleFile(file) {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      // Parse file
      const dataset = await parseFile(file);

      if (!Array.isArray(dataset) || dataset.length === 0) {
        throw new Error("File appears to be empty");
      }

      // Save to sessionStorage
      sessionStorage.setItem("dataset", JSON.stringify(dataset));
      sessionStorage.setItem("fileName", file.name);

      // Redirect to preview
      router.push("/preview");
    } catch (err) {
      setError(err.message || "Failed to parse file");
      setLoading(false);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="upload-wrapper">
      <section className="upload-card" aria-labelledby="upload-title">
        <h2 id="upload-title">Upload Your Dataset</h2>
        <p>
          Instant AI-Powered Quality Analysis — Supported: CSV, JSON, Excel (max
          50MB)
        </p>

        {error && <div className="error-message">{error}</div>}

        <div
          className={`drop-zone ${dragActive ? "drag-active" : ""} ${
            loading ? "loading" : ""
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          aria-label="File drop zone"
        >
          <strong>Drag & Drop File Here</strong>
          <div className="hint">or</div>
          <button
            className="choose-btn"
            type="button"
            disabled={loading}
            onClick={() => fileRef.current && fileRef.current.click()}
          >
            {loading ? "Processing..." : "Choose File"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,application/json,.xlsx,.xls"
            className="hidden-input"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      </section>

      <aside className="side-panel" aria-labelledby="recent-title">
        <h4 id="recent-title">Recent Analyses</h4>
        <div className="meta">No recent analyses yet.</div>

        <hr className="divider" />

        <div className="tips">
          <h4>Quick Tips</h4>
          <div className="tip-item">Ensure headers are in the first row</div>
          <div className="tip-item">Use UTF‑8 encoding for CSVs</div>
          <div className="tip-item">Remove sensitive data before upload</div>
        </div>
      </aside>
    </div>
  );
}
