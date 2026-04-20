import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Database, FileText, Trash2 } from "lucide-react";
import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";
import { saveCanvasUpload, uploadDocumentToStorage, createImportJob, updateImportJob, indexDocumentChunks, loadDossierFiles, deleteDossierFile } from "../../../services/canvasStorage";

// ── Dossier — document import + kennisbank ───────────────────────────────────
const IMPORT_PHASES = {
  queued:    { label: "In wachtrij", pct: 0,   color: "bg-slate-200"  },
  uploading: { label: "Uploaden…",   pct: 25,  color: "bg-[#00AEEF]" },
  reading:   { label: "Lezen…",      pct: 55,  color: "bg-amber-400"  },
  indexing:  { label: "Indexeren…",  pct: 80,  color: "bg-[#8dc63f]"  },
  done:      { label: "Klaar",       pct: 100, color: "bg-[#2c7a4b]"  },
  error:     { label: "Fout",        pct: 100, color: "bg-red-400"    },
};

async function extractFileText(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const arrayBuf = await file.arrayBuffer();

  if (ext === "txt" || ext === "csv") {
    return new TextDecoder("utf-8").decode(arrayBuf);
  }
  if (ext === "pptx") {
    const zip = await JSZip.loadAsync(arrayBuf);
    const parts = [];
    const slideKeys = Object.keys(zip.files)
      .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
      .sort();
    for (const key of slideKeys) {
      const num = key.match(/slide(\d+)\.xml$/)?.[1];
      const xml = await zip.files[key].async("string");
      const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const notePath = `ppt/notesSlides/notesSlide${num}.xml`;
      let notes = "";
      if (zip.files[notePath]) {
        const noteXml = await zip.files[notePath].async("string");
        notes = noteXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
      if (text)  parts.push(`[Slide ${num}] ${text}`);
      if (notes) parts.push(`[Notes ${num}] ${notes}`);
    }
    return parts.join("\n\n");
  }
  if (ext === "pdf") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
    ).toString();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf) }).promise;
    const pages = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      pages.push(`[Pagina ${p}] ` + content.items.map(i => i.str).join(" "));
    }
    return pages.join("\n\n");
  }
  if (ext === "docx") {
    const zip = await JSZip.loadAsync(arrayBuf);
    const docXml = await zip.files["word/document.xml"]?.async("string");
    if (!docXml) throw new Error("Geen tekst gevonden in Word-document.");
    // Vervang alineamarkeringen door newlines, verwijder overige XML-tags
    const text = docXml
      .replace(/<w:br[^>]*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text.length < 30) throw new Error("Word-document bevat geen leesbare tekst.");
    return text;
  }
  throw new Error(`Bestandstype .${ext} wordt niet ondersteund.`);
}

function MasterImporterPanel({ canvasId, userId, onClose }) {
  const [jobs, setJobs]           = useState([]);
  const [dragOver, setDragOver]   = useState(false);
  const [files, setFiles]         = useState([]);       // canvas_uploads uit DB
  const [filesLoading, setFilesLoading] = useState(false);
  const fileInputRef              = useRef(null);

  // Laad Dossier-bestanden vanuit canvas_uploads
  const refreshFiles = async () => {
    if (!canvasId) return;
    setFilesLoading(true);
    const { data } = await loadDossierFiles(canvasId);
    setFiles(data || []);
    setFilesLoading(false);
  };

  useEffect(() => { refreshFiles(); }, [canvasId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" verwijderen uit het Dossier?`)) return;
    await deleteDossierFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateJob = (id, patch) =>
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));

  const processFile = async (file) => {
    const localId = `${Date.now()}_${Math.random()}`;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf","pptx","docx","txt","csv"].includes(ext)) {
      setJobs(prev => [...prev, { id: localId, file, phase: "error", error: `.${ext} niet ondersteund.` }]);
      return;
    }
    setJobs(prev => [...prev, { id: localId, file, phase: "queued", error: null, jobId: null }]);
    try {
      updateJob(localId, { phase: "uploading" });
      let dbJobId = null;
      if (canvasId) {
        const { data: job } = await createImportJob({ canvasId, userId, fileName: file.name, fileType: ext });
        if (job) dbJobId = job.id;
        await uploadDocumentToStorage(file, canvasId);
        if (dbJobId) await updateImportJob(dbJobId, { status: "reading" });
      }
      updateJob(localId, { phase: "reading", jobId: dbJobId });
      const rawText = await extractFileText(file);
      if (!rawText || rawText.trim().length < 20) throw new Error("Geen leesbare tekst gevonden.");
      updateJob(localId, { phase: "indexing" });
      if (dbJobId) await updateImportJob(dbJobId, { status: "indexing" });

      // Sla rawText op en haal het upload_id op voor de chunk FK
      const { uploadId, error: saveErr } = await saveCanvasUpload({
        fileName: file.name, rawText: rawText.slice(0, 10000),
        insights: [], blockKey: "importer", language: "nl",
        canvasId: canvasId || null, userId: userId || null,
      });
      if (saveErr) throw new Error(`Opslag mislukt: ${saveErr.message || saveErr}`);

      // Parent-Child chunking + OpenAI embeddings → document_chunks
      let totalChunks = 0;
      if (uploadId && canvasId) {
        const { totalChildren, error: idxErr } = await indexDocumentChunks(
          uploadId, canvasId, rawText,
          (pct) => updateJob(localId, { indexPct: pct }),
        );
        if (idxErr) throw new Error(`Indexeren mislukt: ${idxErr}`);
        totalChunks = totalChildren || 0;
      }

      if (dbJobId) await updateImportJob(dbJobId, { status: "done", total_chunks: totalChunks, processed_chunks: totalChunks });
      updateJob(localId, { phase: "done", totalChunks });
      refreshFiles(); // Dossier-lijst verversen
    } catch (err) {
      updateJob(localId, { phase: "error", error: err.message });
    }
  };

  const handleFiles = (files) => Array.from(files).forEach(f => processFile(f));
  const activeCount = jobs.filter(j => !["done","error"].includes(j.phase)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-16 px-8 pb-8">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1a365d] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Database size={16} className="text-[#8dc63f]" />
            <div>
              <h2 className="text-white font-black text-sm uppercase tracking-widest">Het Dossier</h2>
              <p className="text-white/50 text-[9px] uppercase tracking-wider">Kennisbank — Magic Staff AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <span className="text-[10px] text-white/60">{activeCount} bezig…</span>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={16} /></button>
          </div>
        </div>

        {/* Drop zone — compact */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`mx-6 mt-5 border-2 border-dashed rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-all
            ${dragOver ? "border-[#1a365d] bg-[#1a365d]/5" : "border-slate-200 hover:border-[#1a365d]/40 hover:bg-slate-50"}`}
        >
          <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.docx,.txt,.csv" multiple className="hidden"
            onChange={e => handleFiles(e.target.files)} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${dragOver ? "bg-[#1a365d]/10" : "bg-slate-100"}`}>
            <Upload size={18} className={dragOver ? "text-[#1a365d]" : "text-slate-400"} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Bestanden toevoegen aan Dossier</p>
            <p className="text-xs text-slate-400">PDF · PPTX · DOCX · TXT · CSV — sleep of klik</p>
          </div>
        </div>

        {/* Actieve upload-jobs */}
        {jobs.length > 0 && (
          <div className="px-6 pt-4 space-y-3">
            {jobs.map(job => {
              const phase = IMPORT_PHASES[job.phase] || IMPORT_PHASES.queued;
              const ext   = job.file.name.split(".").pop().toUpperCase();
              const phaseOrder = ["uploading","reading","indexing","done"];
              const currentIdx = phaseOrder.indexOf(job.phase);
              return (
                <div key={job.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#1a365d]/10 text-[#1a365d] rounded flex-shrink-0">{ext}</span>
                      <span className="text-xs font-semibold text-slate-700 truncate">{job.file.name}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider flex-shrink-0 ${job.phase === "done" ? "text-[#2c7a4b]" : job.phase === "error" ? "text-red-500" : "text-slate-400"}`}>
                      {phase.label}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${phase.color}`} style={{ width: `${phase.pct}%` }} />
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    {phaseOrder.map((p, i) => (
                      <span key={p} className={`text-[8px] uppercase tracking-wider font-semibold px-1 py-0.5 rounded ${
                        job.phase === p ? "bg-[#1a365d] text-white" :
                        (job.phase === "done" || (currentIdx > i && job.phase !== "error")) ? "bg-[#8dc63f]/20 text-[#2c7a4b]" :
                        "text-slate-300"}`}>
                        {IMPORT_PHASES[p]?.label}
                      </span>
                    ))}
                    {job.phase === "indexing" && job.indexPct !== undefined && (
                      <span className="text-[8px] text-slate-400 ml-1">{job.indexPct}%</span>
                    )}
                  </div>
                  {job.phase === "done" && job.totalChunks > 0 && (
                    <p className="text-[9px] text-[#2c7a4b] mt-1">{job.totalChunks} fragmenten geïndexeerd</p>
                  )}
                  {job.phase === "error" && <p className="text-[10px] text-red-500 mt-1">{job.error}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Dossier-lijst — bestanden uit canvas_uploads */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Dossier {files.length > 0 ? `— ${files.length} bestand${files.length !== 1 ? "en" : ""}` : ""}
            </p>
            {filesLoading && <span className="text-[9px] text-slate-300 animate-pulse">laden…</span>}
          </div>
          {!filesLoading && files.length === 0 && (
            <div className="text-center py-8">
              <Database size={24} className="mx-auto text-slate-200 mb-3" />
              <p className="text-xs text-slate-300">Nog geen bestanden in het Dossier.</p>
              <p className="text-[10px] text-slate-200 mt-1">Upload documenten hierboven om de Magic Staff te activeren.</p>
            </div>
          )}
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 group">
              <FileText size={13} className="text-slate-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-600 truncate block">{f.file_name}</span>
                <span className="text-[9px] text-slate-300">
                  {new Date(f.created_at).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <span className="text-[9px] font-semibold text-[#2c7a4b] uppercase tracking-wider flex-shrink-0">Geïndexeerd</span>
              <button
                onClick={() => handleDelete(f.id, f.file_name)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 flex-shrink-0"
                title="Verwijder uit Dossier"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex-shrink-0 flex items-center justify-between">
          <p className="text-[9px] text-slate-300 uppercase tracking-widest">Magic Staff gebruikt alleen documenten uit dit Dossier</p>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-[#1a365d] uppercase tracking-widest transition-colors">Sluiten</button>
        </div>
      </div>
    </div>
  );
}

export default MasterImporterPanel;
