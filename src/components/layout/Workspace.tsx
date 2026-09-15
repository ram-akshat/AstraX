// src/components/layout/Workspace.tsx
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDocumentsStore } from "../../store/documentsStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useCasesStore } from "../../store/casesStore";
import type { Document } from "../../services/documents";

import DocumentList from "../documents/DocumentList";
import UploadDocument from "../upload/UploadDocument";
import NetworkGraph from "../dashboard/analytics/NetworkGraph";
import FactSheet from "../summary/FactSheet";
import { USE_MOCK_API } from "../../config";
import { synthesizeFactSheetFromDocuments } from "../../utils/factSheetSynthesizer";
import TrackBadge from "../ui/TrackBadge";
import Loader from "../ui/Loader";
import Icon from "../ui/Icon";
import { mockFactSheet, mockFinancialTracing } from "../../data/mockCaseData";

export default function Workspace() {
    const selectedCaseId = useWorkspaceStore((state) => state.selectedCaseId);

    const {
        documents,
        isLoading,
        error,
        fetchDocuments,
        addDocument,
    } = useDocumentsStore();

    const cases = useCasesStore((state) => state.cases);
    const selectedCase = cases.find((c) => c.id === selectedCaseId);

    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        if (selectedCaseId) {
            fetchDocuments(selectedCaseId);
        }
    }, [selectedCaseId, fetchDocuments]);

    if (!selectedCaseId) {
        return (
            <main className="flex min-w-0 flex-1 items-center justify-center bg-surface-0 p-6">
                <div className="text-center max-w-sm">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-surface-100 border border-surface-300/50 text-surface-400">
                        <Icon name="shield" size={24} />
                    </div>
                    <h2 className="text-base font-bold text-surface-900">
                        Select an Investigation
                    </h2>
                    <p className="mt-2 text-xs text-surface-500 leading-relaxed">
                        Choose a case from the directory to access evidentiary files, intelligence graph, and fact-sheet analysis.
                    </p>
                    <Link
                        to="/intake"
                        className="mt-6 inline-flex items-center gap-2 rounded-md bg-insignia-500/90 hover:bg-insignia-400 text-surface-0 font-bold px-4 py-2 text-xs transition-colors"
                    >
                        <Icon name="plus" size={12} />
                        <span>Initiate Evidence Intake</span>
                    </Link>
                </div>
            </main>
        );
    }

    const workspaceFactSheet = useMemo(() => {
        if (USE_MOCK_API && documents.length === 0) {
            return {
                ...mockFactSheet,
                caseId: selectedCase?.id || selectedCaseId,
                firNumber: selectedCase?.name || "Case Workspace",
                track: ((selectedCase?.track ?? 2) as 1 | 2),
                triageReason: selectedCase?.triage_reason || mockFactSheet.triageReason,
            };
        }
        return synthesizeFactSheetFromDocuments(
            documents,
            selectedCase?.id || selectedCaseId,
            selectedCase?.name || "Case Workspace",
            ((selectedCase?.track ?? 2) as 1 | 2),
            selectedCase?.triage_reason || "Active Case Workspace"
        );
    }, [documents, selectedCase, selectedCaseId]);

    const isTrack2 = (selectedCase?.track ?? 2) === 2;

    return (
        <>
            <main className="min-w-0 flex-1 overflow-y-auto bg-surface-0 p-5 lg:p-6 space-y-5">
                {/* ── Case Header ─────────── */}
                <div className="panel p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-bold text-surface-900 tracking-tight leading-tight">
                                    {selectedCase?.name ?? "Case Workspace"}
                                </h1>
                                <TrackBadge
                                    track={(selectedCase?.track as 1 | 2) || 2}
                                    triageReason={selectedCase?.triage_reason}
                                />
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-surface-500">
                                <span>
                                    {documents.length} {documents.length === 1 ? "document" : "documents on file"}
                                </span>
                                <span className="text-surface-400/40">│</span>
                                <span>Version {selectedCase?.version || 1}.0</span>
                            </div>
                        </div>

                        {/* CTA for Track 2 */}
                        {isTrack2 && (
                            <Link
                                to={`/cases/${selectedCaseId}`}
                                className="inline-flex items-center justify-center gap-2 rounded-md bg-insignia-500/90 hover:bg-insignia-400 text-surface-0 font-bold px-4 py-2 text-xs transition-all shrink-0"
                            >
                                <Icon name="radar" size={13} />
                                <span>Open Full Analysis</span>
                                <Icon name="arrow-right" size={13} />
                            </Link>
                        )}
                    </div>
                    
                    <p className="text-xs text-surface-600 leading-relaxed mt-3 pt-3 border-t border-surface-200/50">
                        {selectedCase?.triage_reason ||
                            "This case investigates organized financial and telecommunication irregularities. Multi-modality pipelines correlate extracted entities across banking ledgers and surveillance records."}
                    </p>
                </div>

                {/* ── Network Graph Preview ──────────── */}
                <div className="panel p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-800 flex items-center gap-2">
                                <Icon name="network-graph" size={13} className="text-insignia-400" />
                                <span>Knowledge Graph Preview</span>
                            </h3>
                            <p className="text-[10px] text-surface-500 mt-0.5 font-mono">
                                Real-time topological rendering of primary suspect interactions.
                            </p>
                        </div>
                        {isTrack2 && (
                            <Link
                                to={`/cases/${selectedCaseId}#knowledge-graph`}
                                className="text-[10px] font-mono text-insignia-400 hover:text-insignia-300 transition-colors"
                            >
                                Full Interactive Graph →
                            </Link>
                        )}
                    </div>

                    <div className="h-[340px] w-full">
                        <NetworkGraph
                            data={mockFinancialTracing}
                            theme="digital"
                            showControls={false}
                        />
                    </div>
                </div>

                {/* ── Documents List ────────────────── */}
                <div className="panel p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-surface-800">
                                Case Evidence Files
                            </h2>
                            <p className="text-[10px] text-surface-500 mt-0.5 font-mono">
                                Uploaded digital and scanned exhibits
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowUpload(true)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-insignia-500/90 hover:bg-insignia-400 text-surface-0 font-bold px-3 py-1.5 text-[11px] transition-colors"
                        >
                            <Icon name="upload" size={12} />
                            <span>Upload Exhibit</span>
                        </button>
                    </div>

                    {isLoading && <Loader label="Loading exhibits…" />}

                    {error && !isLoading && (
                        <div className="rounded-lg border border-surface-300/50 bg-surface-0 p-4">
                            <p className="text-xs text-red-400 font-mono">{error}</p>
                            <button
                                type="button"
                                onClick={() => fetchDocuments(selectedCaseId)}
                                className="mt-2 text-[10px] text-surface-500 underline hover:text-surface-300"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && (
                        <DocumentList documents={documents} />
                    )}
                </div>

                {/* ── Embedded Fact Sheet ────────── */}
                <div className="pt-1">
                    <FactSheet
                        data={workspaceFactSheet}
                        caseId={selectedCase?.id || selectedCaseId}
                        isEmbedded={true}
                    />
                </div>
            </main>

            {/* Upload modal */}
            {showUpload && (
                <UploadDocument
                    caseId={selectedCaseId}
                    onUploaded={(doc: Document) => {
                        addDocument(doc);
                    }}
                    onClose={() => setShowUpload(false)}
                />
            )}
        </>
    );
}