"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import TopNav from "@/components/layout/TopNav";
import { FolderOpen, Upload, FileText, ImageIcon, File, X, CheckCircle, AlertCircle, Download, RefreshCw } from "lucide-react";

interface Doc {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  category: string;
  signedUrl: string | null;
  createdAt: string;
}

interface UploadingFile {
  tempId: string;
  name: string;
  size: number;
  mimeType: string;
  progress: number;
  error?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf")) return FileText;
  return File;
}

const ACCEPTED = [
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png", "image/jpeg", "image/jpg",
];
const MAX_SIZE = 25 * 1024 * 1024;

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadDocs() {
    setLoading(true);
    const res = await fetch("/api/documents");
    if (res.ok) setDocs(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadDocs(); }, []);

  async function uploadFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      alert(`"${file.name}" is not a supported file type.`);
      return;
    }
    if (file.size > MAX_SIZE) {
      alert(`"${file.name}" exceeds the 25MB limit.`);
      return;
    }

    const tempId = Math.random().toString(36).slice(2);
    setUploading((prev) => [...prev, { tempId, name: file.name, size: file.size, mimeType: file.type, progress: 10 }]);

    // Simulate progress while uploading
    const ticker = setInterval(() => {
      setUploading((prev) =>
        prev.map((u) => u.tempId === tempId && u.progress < 85
          ? { ...u, progress: Math.min(85, u.progress + 15) }
          : u)
      );
    }, 300);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/documents/upload", { method: "POST", body: form });
    clearInterval(ticker);

    if (res.ok) {
      const doc = await res.json();
      setUploading((prev) => prev.filter((u) => u.tempId !== tempId));
      setDocs((prev) => [doc, ...prev]);
    } else {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      setUploading((prev) =>
        prev.map((u) => u.tempId === tempId ? { ...u, progress: 0, error: err.error ?? "Upload failed" } : u)
      );
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach(uploadFile);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function dismissUpload(tempId: string) {
    setUploading((prev) => prev.filter((u) => u.tempId !== tempId));
  }

  const financialCount = docs.filter((d) => d.category === "FINANCIAL_STATEMENT").length;
  const letterCount = docs.filter((d) => d.category === "LETTERS_OF_SUPPORT").length;
  const imageCount = docs.filter((d) => d.mimeType.startsWith("image/")).length;

  return (
    <div>
      <TopNav
        title="Documents"
        subtitle="Store and manage files for your grant applications"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={loadDocs} className="rounded-lg border p-2 transition-colors hover:bg-[var(--cream)]"
              style={{ borderColor: "var(--border)" }} title="Refresh">
              <RefreshCw className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            </button>
            <button onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
              <Upload className="h-4 w-4" />
              Upload File
            </button>
          </div>
        }
      />

      <input ref={inputRef} type="file" multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />

      <div className="p-6 max-w-5xl mx-auto">
        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="mb-6 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all"
          style={{ borderColor: dragging ? "var(--gold)" : "var(--border)", background: dragging ? "rgba(196,151,74,0.05)" : "var(--warm-gray)" }}>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(196,151,74,0.1)" }}>
            <FolderOpen className="h-6 w-6" style={{ color: "var(--gold)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
            {dragging ? "Drop files to upload" : "Drag & drop files here"}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>PDF, Word, Excel, PNG, JPG up to 25MB</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "var(--border)", background: "white", color: "var(--navy)" }}>
            <Upload className="h-4 w-4" />
            Browse files
          </div>
        </div>

        {/* Category counts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Financial Statements", count: financialCount, icon: FileText, color: "rgba(74,124,196,0.1)", iconColor: "#4A7CC4" },
            { label: "Letters of Support", count: letterCount, icon: File, color: "rgba(124,74,196,0.1)", iconColor: "#7C4AC4" },
            { label: "Photos & Media", count: imageCount, icon: ImageIcon, color: "rgba(196,151,74,0.1)", iconColor: "var(--gold)" },
          ].map((cat) => (
            <div key={cat.label} className="rounded-xl border p-4 flex items-center gap-4" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: cat.color }}>
                <cat.icon className="h-5 w-5" style={{ color: cat.iconColor }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{cat.label}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{cat.count} file{cat.count !== 1 ? "s" : ""}</p>
              </div>
            </div>
          ))}
        </div>

        {/* In-progress uploads */}
        {uploading.length > 0 && (
          <div className="rounded-xl border overflow-hidden mb-4" style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Uploading</p>
            </div>
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {uploading.map((u) => {
                const Icon = getFileIcon(u.mimeType);
                return (
                  <li key={u.tempId} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--warm-gray)" }}>
                      <Icon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{u.name}</p>
                      {u.error ? (
                        <p className="text-xs text-red-600 mt-0.5">{u.error}</p>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 rounded-full h-1.5" style={{ background: "var(--warm-gray)" }}>
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${u.progress}%`, background: "var(--gold)" }} />
                          </div>
                          <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{u.progress}%</span>
                        </div>
                      )}
                    </div>
                    {u.error && (
                      <button onClick={() => dismissUpload(u.tempId)} className="rounded p-1" style={{ color: "var(--text-muted)" }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Saved docs */}
        {loading ? (
          <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div className="skeleton h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-48 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : docs.length > 0 ? (
          <div className="rounded-xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                {docs.length} document{docs.length !== 1 ? "s" : ""}
              </p>
            </div>
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {docs.map((doc) => {
                const Icon = getFileIcon(doc.mimeType);
                return (
                  <li key={doc.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--warm-gray)" }}>
                      <Icon className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--navy)" }}>{doc.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {formatBytes(doc.sizeBytes)} · {doc.category.replace(/_/g, " ").toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      {doc.signedUrl && (
                        <a href={doc.signedUrl} target="_blank" rel="noreferrer"
                          className="text-xs font-medium px-2 py-1 rounded flex items-center gap-1"
                          style={{ color: "var(--gold)", background: "rgba(196,151,74,0.08)" }}>
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      )}
                      <button onClick={() => deleteDoc(doc.id)} className="rounded p-1 transition-colors hover:bg-red-50"
                        style={{ color: "var(--text-muted)" }}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border p-12 text-center" style={{ background: "white", borderColor: "var(--border)" }}>
            <FolderOpen className="mx-auto h-10 w-10 mb-3" style={{ color: "var(--border)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>No documents yet</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Upload financial statements, letters of support, photos, and other files needed for your grant applications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
