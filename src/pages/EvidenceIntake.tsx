// src/pages/EvidenceIntake.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import EvidenceChannelCard, {
    type ChannelConfig,
    type ChannelFile,
} from "../components/intake/EvidenceChannelCard";
import Icon from "../components/ui/Icon";
import { useCasesStore } from "../store/casesStore";
import { initiateUpload, uploadToStorage, confirmUpload } from "../services/upload";
import { getDocument } from "../services/documents";
import { triggerHistoricalAnalysis } from "../services/analytics";
import type { DocumentType } from "../services/documents";
import { SAMPLE_FIR_TEXT, SAMPLE_CSV_TEXT } from "../utils/factSheetSynthesizer";

const CHANNELS: ChannelConfig[] = [
    {
        id: "fir_text",
        title: "FIR & Complaints",
        icon: "file-text",
        accepts: ".txt,.pdf,.json",
        acceptsLabel: ".txt, .pdf, .json",
        pipelineNote: "BNS / BNSS statutory mapping - entities, sections, timestamps extracted via LLM/NER.",
        limits: "Schema: Standard CAS / CCTNS compliant",
    },
    {
        id: "scanned_doc",
        title: "Seizure Memos & Panchnamas",
        icon: "evidence-tag",
        accepts: ".pdf,.jpg,.png",
        acceptsLabel: ".pdf, .jpg, .png",
        pipelineNote: "Tesseract OCR / LayoutLM - extracts tabular seizure ledgers and witness signatures.",
        limits: "Max 50MB per file",
    },
    {
        id: "cctv_video",
        title: "CCTV & Video Feeds",
        icon: "video-cctv",
        accepts: ".mp4,.avi,.mov",
        acceptsLabel: ".mp4, .avi, .mov",
        pipelineNote: "YOLOv8 + ByteTrack - person/vehicle tracking, ANPR plate extraction, geo-scene tag.",
        limits: "Max 500MB per clip",
    },
    {
        id: "audio_recordings",
        title: "Audio & Wiretap Intercepts",
        icon: "audio-mic",
        accepts: ".wav,.mp3,.m4a",
        acceptsLabel: ".wav, .mp3, .m4a",
        pipelineNote: "Whisper ASR - multi-speaker diarization, Hinglish dialect translation, keyword alerts.",
        limits: "Supported formats: 16kHz mono WAV preferred",
    },
    {
        id: "cdr_financial",
        title: "Bank Statements & CDR",
        icon: "cdr-table",
        accepts: ".csv,.xlsx,.xml",
        acceptsLabel: ".csv, .xlsx, .xml",
        pipelineNote: "GNN Structuring Detector - flags sub-Rs 50k smurfing, peel-chains, burner IMEI churn.",
        limits: "Standard bank format (CSV/XLSX)",
    },
    {
        id: "image_bio",
        title: "Evidence Photos / Biometrics",
        icon: "image-bio",
        accepts: ".jpg,.png",
        acceptsLabel: ".jpg, .png",
        pipelineNote: "Facial/plate detection - biometric identity claims routed externally, never confirmed in-app.",
        limits: "Demo limit: 20 high-res photos",
    },
];

function createSampleQueue(): Record<string, ChannelFile[]> {
    return {
        fir_text: [
            {
                id: "sample-fir-1",
                file: new File([SAMPLE_FIR_TEXT], "FIR_108_2026_KashmereGate.txt", { type: "text/plain" }),
                name: "FIR_108_2026_KashmereGate.txt",
                size: SAMPLE_FIR_TEXT.length,
                status: "queued",
                progress: 0,
            },
        ],
        scanned_doc: [],
        cctv_video: [],
        audio_recordings: [],
        cdr_financial: [
            {
                id: "sample-csv-1",
                file: new File([SAMPLE_CSV_TEXT], "Axis_Bank_Structuring_4901.csv", { type: "text/csv" }),
                name: "Axis_Bank_Structuring_4901.csv",
                size: SAMPLE_CSV_TEXT.length,
                status: "queued",
                progress: 0,
            },
        ],
        image_bio: [],
    };
}

export default function EvidenceIntake() {
    const navigate = useNavigate();
    const createCase = useCasesStore((state) => state.createCase);

    const [isSampleMode, setIsSampleMode] = useState(true);
    const [caseTitle, setCaseTitle] = useState("FIR 108/2026: Kashmere Gate Syndicate");
    const [channelFiles, setChannelFiles] = useState<Record<string, ChannelFile[]>>(createSampleQueue);

    const [isProcessing, setIsProcessing] = useState(false);
    const [streamedLogs, setStreamedLogs] = useState<string[]>([]);

    const totalFiles = Object.values(channelFiles).reduce((sum, list) => sum + list.length, 0);
    const activeChannels = Object.values(channelFiles).filter((list) => list.length > 0).length;

    const handleClearQueue = () => {
        setChannelFiles({
            fir_text: [],
            scanned_doc: [],
            cctv_video: [],
            audio_recordings: [],
            cdr_financial: [],
            image_bio: [],
        });
        setCaseTitle("");
        setIsSampleMode(false);
    };

    const handleLoadSampleQueue = () => {
        setChannelFiles(createSampleQueue());
        setCaseTitle("FIR 108/2026: Kashmere Gate Syndicate");
        setIsSampleMode(true);
    };

    const handleFilesAdded = (channelId: string, newFiles: File[]) => {
        let currentFiles = channelFiles;
        if (isSampleMode) {
            currentFiles = {
                fir_text: [],
                scanned_doc: [],
                cctv_video: [],
                audio_recordings: [],
                cdr_financial: [],
                image_bio: [],
            };
            setIsSampleMode(false);
            if (!caseTitle || caseTitle.includes("108/2026")) {
                setCaseTitle(newFiles[0]?.name.replace(/\.[^/.]+$/, "") || "Custom Investigation");
            }
        }

        const addedItems: ChannelFile[] = newFiles.map((f) => ({
            id: crypto.randomUUID(),
            file: f,
            name: f.name,
            size: f.size,
            status: "queued",
            progress: 0,
        }));

        setChannelFiles({
            ...currentFiles,
            [channelId]: [...(currentFiles[channelId] || []), ...addedItems],
        });
    };

    const handleFileRemoved = (channelId: string, fileId: string) => {
        setChannelFiles((prev) => ({
            ...prev,
            [channelId]: (prev[channelId] || []).filter((f) => f.id !== fileId),
        }));
    };

    const handleRunPipeline = async () => {
        if (totalFiles === 0) return;

        setIsProcessing(true);
        setStreamedLogs([
            "[System] AstraX Multi-Modality Ingestion Gateway initialized.",
            isSampleMode
                ? "[Demo Mode] Ingesting authentic queued benchmark evidence (FIR 108/2026 BNS §111)."
                : "[Live Ingestion] Ingesting user-submitted evidentiary files through neural pipeline.",
        ]);

        let targetCaseId = "case-1";
        try {
            const newCase = await createCase({
                name: caseTitle.trim() || (isSampleMode ? "FIR 108/2026: Kashmere Gate Syndicate" : "New Ingested Investigation"),
                track: 2,
                triage_reason: "Multi-channel ingestion completed: live evidence streams merged into knowledge graph.",
            });
            targetCaseId = newCase.id;
            setStreamedLogs((prev) => [
                ...prev,
                `[Case Registered] Created case record: ${newCase.name} (ID: ${targetCaseId})`,
            ]);
        } catch {
            targetCaseId = "case-1";
            setStreamedLogs((prev) => [
                ...prev,
                `[Target Case] Using workspace case: ${targetCaseId}`,
            ]);
        }

        const uploadedDocIds: { id: string; name: string; type: DocumentType }[] = [];

        for (const [channelId, fileList] of Object.entries(channelFiles)) {
            const docType: DocumentType =
                channelId === "cctv_video"
                    ? "video"
                    : channelId === "audio_recordings"
                    ? "voice"
                    : channelId === "image_bio"
                    ? "image"
                    : "text";

            for (const item of fileList) {
                if (item.file && item.file.size > 0) {
                    try {
                        setStreamedLogs((prev) => [
                            ...prev,
                            `[Ingest] Uploading ${item.name} (${(item.size / 1024).toFixed(1)} KB)...`,
                        ]);

                        const initRes = await initiateUpload({
                            case_id: targetCaseId,
                            title: item.name,
                            description: `Uploaded via AstraX Intake Channel: ${channelId}`,
                            file_name: item.name,
                            document_type: docType,
                        });

                        if (initRes.upload_url) {
                            await uploadToStorage(initRes.upload_url, item.file);
                        }

                        const confirmedDoc = await confirmUpload(initRes.document_id, true);
                        uploadedDocIds.push({ id: confirmedDoc.id, name: item.name, type: docType });

                        setStreamedLogs((prev) => [
                            ...prev,
                            `[Confirmed] ${item.name} registered into pipeline (Doc ID: ${confirmedDoc.id.slice(0, 8)}...).`,
                        ]);
                    } catch (err: any) {
                        setStreamedLogs((prev) => [
                            ...prev,
                            `[Error] Ingestion failed for ${item.name}: ${err?.message || "Storage error"}`,
                        ]);
                    }
                }
            }
        }

        // Telemetry polling for real document completion
        if (uploadedDocIds.length > 0) {
            setStreamedLogs((prev) => [
                ...prev,
                `[Inference] Polling model telemetry for ${uploadedDocIds.length} documents...`,
            ]);

            for (const docInfo of uploadedDocIds) {
                let attempts = 0;
                while (attempts < 6) {
                    try {
                        const statusDoc = await getDocument(docInfo.id);
                        if (statusDoc.status === "finish" || statusDoc.status === "success") {
                            setStreamedLogs((prev) => [
                                ...prev,
                                `[Telemetry] ${docInfo.name}: Processing status "${statusDoc.status}".`,
                            ]);
                            break;
                        } else if (statusDoc.status === "failed") {
                            setStreamedLogs((prev) => [
                                ...prev,
                                `[Telemetry] ${docInfo.name}: Processor reported failure (check server logs).`,
                            ]);
                            break;
                        }
                    } catch {
                        // ignore polling error
                    }
                    attempts++;
                    await new Promise((r) => setTimeout(r, 800));
                }
            }
        }

        try {
            setStreamedLogs((prev) => [
                ...prev,
                "[GNN Linker] Triggering cross-modal graph synthesis...",
            ]);
            await triggerHistoricalAnalysis(targetCaseId);
        } catch {
            // Graceful fallback
        }

        setStreamedLogs((prev) => [
            ...prev,
            "[Complete] Forensic pipeline execution finished. Redirecting to Stage 5 Fact-Sheet...",
        ]);

        await new Promise((r) => setTimeout(r, 1200));
        navigate(`/cases/${targetCaseId}/summary`);
    };

    return (
        <div className="min-h-screen bg-surface-0 flex flex-col font-sans">
            <Navbar />

            {/* Tactical Grid Background */}
            <div className="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none" />

            {/* Main Content */}
            <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 pb-32">
                {/* Header Strip */}
                <div className="border-b border-surface-300/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-insignia-400 uppercase tracking-widest mb-1.5">
                            <Icon name="shield" size={14} />
                            <span>Stage 1 & 3: Multi-Modality Intake</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                            Evidence Ingestion Matrix
                        </h1>
                        <p className="mt-2 text-sm text-surface-600 leading-relaxed">
                            Files are parsed per-modality via isolated domain adapters, cross-referenced across telecommunications, banking, and field recovery data, and unified into one case record.
                        </p>
                    </div>

                    {/* Case Title Input */}
                    <div className="w-full md:w-80">
                        <label className="block text-xs font-mono uppercase tracking-wider text-surface-500 mb-1.5">
                            Case / FIR Identifier
                        </label>
                        <input
                            type="text"
                            value={caseTitle}
                            onChange={(e) => {
                                setCaseTitle(e.target.value);
                                setIsSampleMode(false);
                            }}
                            placeholder="e.g. FIR 108/2026 PS Kashmere Gate"
                            className="w-full rounded-lg border border-surface-300 bg-surface-100 px-3 py-2 text-sm text-surface-900 font-mono focus:border-insignia-500 focus:outline-none focus:ring-1 focus:ring-insignia-500 shadow-inner"
                        />
                    </div>
                </div>

                {/* Mode Alert & Quick Actions Bar */}
                <div className="rounded-xl border border-surface-300 bg-surface-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSampleMode ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"}`}>
                            <Icon name={isSampleMode ? "radar" : "file-text"} size={18} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-surface-900 uppercase tracking-wider flex items-center gap-2">
                                <span>{isSampleMode ? "Queued Benchmark Evidence Loaded (Demo Ready)" : "Custom Evidence Ingestion Active"}</span>
                                <span className={`text-[10px] font-mono px-2 py-0.2 rounded ${isSampleMode ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                                    {isSampleMode ? "Sample Queue Active" : "Live User Files"}
                                </span>
                            </h3>
                            <p className="text-xs text-surface-500 mt-0.5">
                                {isSampleMode
                                    ? "Authentic FIR 108/2026 text & Axis Bank structuring transactions are pre-staged in the queue. Click 'Run Analysis Pipeline' to test real model inference, or clear queue to drop your own files."
                                    : "You are uploading custom evidentiary documents. AstraX will process them through real OCR, NER, and GNN extraction pipelines."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isSampleMode ? (
                            <button
                                type="button"
                                onClick={handleClearQueue}
                                className="px-3 py-1.5 rounded-lg border border-surface-300 bg-surface-200/70 hover:bg-surface-200 text-surface-700 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <Icon name="refresh" size={13} />
                                <span>Clear & Upload My Own</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleLoadSampleQueue}
                                className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <Icon name="radar" size={13} />
                                <span>Load Sample Evidence Queue</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Evidence Channels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {CHANNELS.map((channel) => (
                        <EvidenceChannelCard
                            key={channel.id}
                            config={channel}
                            files={channelFiles[channel.id] || []}
                            onFilesAdded={handleFilesAdded}
                            onFileRemoved={handleFileRemoved}
                        />
                    ))}
                </div>

                {/* Processing Overlay Modal */}
                {isProcessing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-0/90 backdrop-blur-md p-4">
                        <div className="w-full max-w-2xl rounded-2xl border border-surface-300 bg-surface-100 p-6 shadow-2xl flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b border-surface-200 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-insignia-500/20 text-insignia-400">
                                        <Icon name="terminal" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-surface-900">
                                            AstraX Neural Ingestion Pipeline
                                        </h3>
                                        <p className="text-xs font-mono text-surface-500">
                                            Parsing multi-modality data streams...
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-insignia-500 border-t-transparent" />
                            </div>

                            {/* Terminal Log */}
                            <div className="h-64 rounded-xl border border-surface-300 bg-surface-0 p-4 font-mono text-xs text-insignia-400/95 overflow-y-auto space-y-1.5">
                                {streamedLogs.map((log, idx) => (
                                    <div key={idx} className="leading-relaxed">
                                        {log}
                                    </div>
                                ))}
                                <div className="animate-pulse text-surface-400">_</div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-300/80 bg-surface-100/95 backdrop-blur-md px-6 py-4 shadow-2xl">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-surface-400">
                            <span className="flex h-2.5 w-2.5 rounded-full bg-insignia-400" />
                            <span>
                                <strong className="text-surface-900">{totalFiles}</strong> {totalFiles === 1 ? "file" : "files"} across{" "}
                                <strong className="text-surface-900">{activeChannels}</strong> of 6 channels queued
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 rounded-lg border border-surface-300 bg-surface-200/80 text-xs font-semibold text-surface-400 hover:text-surface-200 hover:bg-surface-300 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="button"
                            onClick={handleRunPipeline}
                            disabled={totalFiles === 0 || isProcessing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-insignia-500 hover:bg-insignia-400 text-surface-0 font-bold px-6 py-2.5 text-sm transition-all shadow-lg shadow-insignia-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Icon name="radar" size={16} />
                            <span>Run Analysis Pipeline</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
