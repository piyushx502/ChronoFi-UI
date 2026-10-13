"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Search,
  ExternalLink,
  FileCheck,
  Sparkles,
} from "lucide-react";

interface DocumentItem {
  id: number;
  filename: string;
  status: string;
  size_bytes: number;
  document_type?: string | null;
  financial_year?: string | null;
  issuer?: string | null;
}

interface ConversationThread {
  id: string;
  user_id: number;
  title?: string;
  created_at: string;
  updated_at: string;
}

export default function TranscriptsAndDocumentsPage() {
  const [activeTab, setActiveTab] = useState<"documents" | "transcripts">("documents");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/documents/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchThreads = async () => {
    setIsLoadingThreads(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/v1/threads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (err) {
      console.error("Failed to load conversation threads:", err);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchThreads();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF documents are supported for financial intelligence extraction.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Upload failed with status ${res.status}`);
      }

      setUploadSuccess(`"${file.name}" uploaded successfully. Extraction pipeline running in background.`);
      fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-6 text-zinc-100">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
              Document Intelligence & AI Audit Vault
            </h1>
            <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              RAG Citations & Checkpoints
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Secure financial document ingestion, source-grounded fact extraction, and multi-turn conversational transcripts.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 self-start shadow-sm">
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "documents"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Financial Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab("transcripts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "transcripts"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            Conversation Threads ({threads.length})
          </button>
        </div>
      </header>

      {/* Upload Banner & Notification */}
      {uploadError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Tab 1: Documents Vault */}
      {activeTab === "documents" && (
        <div className="flex flex-col gap-6">
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-blue-500/60 transition bg-zinc-950/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="application/pdf"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition">
              {isUploading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-zinc-200 block">
                {isUploading ? "Uploading & Extracting Financial Data..." : "Click to upload Form 16, Loan Sanction, or Tax PDF"}
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                PDF documents up to 10MB • AES-256 isolated storage • Vector chunked for citation verification
              </span>
            </div>
          </div>

          {/* Document List */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Indexed Knowledge Documents</h3>
              </div>
              <button
                onClick={fetchDocuments}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition font-mono"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {isLoadingDocs && (
              <div className="py-12 flex items-center justify-center text-xs text-zinc-500 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                Loading indexed documents...
              </div>
            )}

            {!isLoadingDocs && documents.length === 0 && (
              <div className="py-12 text-center text-xs text-zinc-500">
                No financial documents uploaded yet. Upload a Form 16 or Loan PDF to enable grounded evidence citations.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-950/40 border border-blue-800/30 flex items-center justify-center text-blue-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-zinc-200 block truncate max-w-[220px]">
                          {doc.filename}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {(doc.size_bytes / 1024).toFixed(1)} KB • ID #{doc.id}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition rounded-lg hover:bg-zinc-800/50"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="border-t border-zinc-800/60 pt-2 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-mono">
                      Type: {doc.document_type || "FINANCIAL_PDF"}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                      doc.status === "INDEXED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Conversation Threads Audit */}
      {activeTab === "transcripts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Threads List */}
          <div className="lg:col-span-5 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-semibold text-zinc-200">Historical Checkpoints</span>
              <button
                onClick={fetchThreads}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition font-mono"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {isLoadingThreads && (
              <div className="py-12 flex items-center justify-center text-xs text-zinc-500 gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                Retrieving conversation history...
              </div>
            )}

            {!isLoadingThreads && threads.length === 0 && (
              <div className="py-12 text-center text-xs text-zinc-500">
                No active conversations recorded yet. Chat in the Terminal tab to initialize a persistent thread.
              </div>
            )}

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]">
              {threads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedThread(t)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col gap-1 ${
                    selectedThread?.id === t.id
                      ? "bg-zinc-800/80 border-emerald-500/50 shadow-sm"
                      : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-medium text-zinc-200 truncate">
                    {t.title || `Thread ${t.id.slice(0, 8)}...`}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Updated: {new Date(t.updated_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Viewer */}
          <div className="lg:col-span-7 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  {selectedThread ? `Audit Inspection: ${selectedThread.id.slice(0, 8)}` : "Select a thread to audit"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                LangGraph Checkpoint SQLite
              </span>
            </div>

            {selectedThread ? (
              <div className="flex flex-col gap-3 text-xs">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Thread ID:</span>
                    <span className="text-zinc-300">{selectedThread.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Created:</span>
                    <span className="text-zinc-300">{new Date(selectedThread.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Checkpointer:</span>
                    <span className="text-emerald-400 font-semibold">Durable SqliteSaver</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-200/90 leading-relaxed">
                  <span className="font-semibold block mb-1">State Integrity & Citation Grounding:</span>
                  This thread retains full conversation memory across restarts. When questions involve financial figures from uploaded PDFs, answers require source evidence formatted as <span className="font-mono bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300">[Filename, Page X]</span>.
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-zinc-500">
                Select any conversation thread from the left to view state checkpoints, agent routing logs, and grounding evidence.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
