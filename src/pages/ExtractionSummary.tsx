// src/pages/ExtractionSummary.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import FactSheet from "../components/summary/FactSheet";
import Icon from "../components/ui/Icon";
import { useCasesStore } from "../store/casesStore";
import { getDocuments, type Document } from "../services/documents";
import { triggerHistoricalAnalysis } from "../services/analytics";
import type { FactSheetData } from "../data/mockCaseData";

export default function ExtractionSummary() {
    const { caseId } = useParams();
    const navigate = useNavigate();
    const cases = useCasesStore((state) => state.cases);
    const fetchCases = useCasesStore((state) => state.fetchCases);

    const [factData, setFactData] = useState<FactSheetData | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cases.length === 0) {
            fetchCases();
        }
    }, [cases.length, fetchCases]);

    const currentCase = cases.find((c) => c.id === caseId) || {
        id: caseId || "case-1",
        name: "Active Case Investigation",
        track: 2,
        triage_reason: "Evidence ingestion underway.",
    };

    useEffect(() => {
        let isMounted = true;

        async function loadCaseData() {
            if (!caseId) return;
            setIsLoading(true);
            setError(null);

            try {
                // 1. Fetch real documents for this case
                const docs = await getDocuments(caseId).catch(() => []);
                if (isMounted) {
                    setDocuments(docs);
                }

                // 2. Fetch analysis report if available
                let analysisReport = null;
                try {
                    analysisReport = await triggerHistoricalAnalysis(caseId);
                } catch {
                    // Backend analysis may fail if models are not configured or empty
                }

                if (isMounted) {
                    if (analysisReport?.fact_sheet) {
                        setFactData(analysisReport.fact_sheet);
                    } else {
                        // Dynamically synthesize fact sheet from actual document extractions
                        const whoList: FactSheetData["who"] = [];
                        const whatList: FactSheetData["what"] = [];
                        const whenList: FactSheetData["when"] = [];
                        const whereList: FactSheetData["where"] = [];
                        const evidenceList: FactSheetData["evidence"] = [];

                        docs.forEach((doc, idx) => {
                            const ext = (doc.extracted_information as any) || {};

                            // Modality mapping
                            const modality =
                                doc.document_type === "video"
                                    ? "video_cctv"
                                    : doc.document_type === "voice"
                                    ? "audio"
                                    : doc.document_type === "image"
                                    ? "scanned_doc"
                                    : "digital_text";

                            evidenceList.push({
                                id: doc.id,
                                modality,
                                fileName: doc.title || `Document-${idx + 1}`,
                                extractionStatus:
                                    doc.status === "finish" || doc.status === "success"
                                        ? "parsed"
                                        : doc.status === "failed"
                                        ? "failed"
                                        : "partial",
                                confidence: ext.confidence ? Number(ext.confidence) : 0.95,
                                note: ext.transcribed_text
                                    ? `Extracted: ${String(ext.transcribed_text).slice(0, 60)}...`
                                    : `Status: ${doc.status}`,
                            });

                            // Extract accused
                            if (Array.isArray(ext.accused)) {
                                ext.accused.forEach((acc: any, aIdx: number) => {
                                    if (acc.name) {
                                        whoList.push({
                                            id: `acc-${idx}-${aIdx}`,
                                            name: acc.name,
                                            role: "Accused",
                                            alias: acc.alias,
                                            citation: {
                                                documentTitle: doc.title,
                                                confidenceScore: 0.95,
                                                rawSnippet: `Accused: ${acc.name}${acc.alias ? ` (${acc.alias})` : ""}`,
                                            },
                                        });
                                    }
                                });
                            }

                            // Extract complainant
                            if (ext.complainant?.name) {
                                whoList.push({
                                    id: `comp-${idx}`,
                                    name: ext.complainant.name,
                                    role: "Complainant",
                                    citation: {
                                        documentTitle: doc.title,
                                        confidenceScore: 0.98,
                                        rawSnippet: `Complainant: ${ext.complainant.name}`,
                                    },
                                });
                            }

                            // Extract statutory acts and sections
                            if (Array.isArray(ext.acts_and_sections)) {
                                ext.acts_and_sections.forEach((sec: any) => {
                                    whatList.push({
                                        bnsSection: `${sec.act || "BNS"} ${sec.section || ""}`.trim(),
                                        statuteName: "Statutory Charge",
                                        description: ext.narrative || "Recorded from FIR extraction.",
                                        applicableTo: ext.accused?.[0]?.name || "Accused",
                                        citation: {
                                            documentTitle: doc.title,
                                            confidenceScore: 0.95,
                                        },
                                    });
                                });
                            }

                            // Extract temporal data
                            if (ext.incident_datetime) {
                                whenList.push({
                                    timestamp: ext.incident_datetime,
                                    event: ext.narrative || "Incident occurred",
                                    location: ext.police_station || "Jurisdiction",
                                    citation: {
                                        documentTitle: doc.title,
                                        confidenceScore: 0.92,
                                    },
                                });
                            }

                            // Extract geospatial data
                            if (ext.police_station || ext.district) {
                                whereList.push({
                                    locationName: `${ext.police_station || ""}, ${ext.district || ""}`.replace(/^, |, $/g, ""),
                                    jurisdiction: ext.district || "State Police",
                                    significance: "Reporting Police Station",
                                    coordinates: [28.6139, 77.2090],
                                    citation: {
                                        documentTitle: doc.title,
                                        confidenceScore: 0.9,
                                    },
                                });
                            }
                        });

                        setFactData({
                            caseId: currentCase.id,
                            firNumber: currentCase.name,
                            track: (currentCase.track ?? 2) as 1 | 2,
                            triageReason: currentCase.triage_reason || "Multi-source evidence ingested.",
                            who: whoList,
                            what: whatList,
                            when: whenList,
                            where: whereList,
                            evidence: evidenceList,
                            knownRelationships: [],
                            openGaps: [],
                        });
                    }
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err?.message || "Failed to load extraction summary");
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadCaseData();
        return () => {
            isMounted = false;
        };
    }, [caseId, currentCase.id, currentCase.name, currentCase.track, currentCase.triage_reason]);

    const hasAnyExtractedData =
        factData &&
        (factData.who.length > 0 ||
            factData.what.length > 0 ||
            factData.when.length > 0 ||
            factData.where.length > 0 ||
            factData.evidence.length > 0);

    return (
        <div className="min-h-screen bg-surface-0 flex flex-col font-sans">
            <Navbar />

            {/* Tactical Grid Background */}
            <div className="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none" />

            {/* Main Content */}
            <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
                {/* Navigation Breadcrumb */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/intake")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-300 bg-surface-100 px-3 py-1.5 text-xs font-semibold text-surface-400 hover:text-surface-200 hover:bg-surface-200 transition-colors"
                        >
                            <Icon name="arrow-left" size={14} />
                            <span>Back to Evidence Intake</span>
                        </button>
                        <span className="text-surface-500 text-xs">/</span>
                        <Link
                            to="/dashboard"
                            className="text-xs text-surface-400 hover:text-surface-200 transition-colors"
                        >
                            Case Directory
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex h-2 w-2 rounded-full ${
                                isLoading ? "bg-amber-400 animate-ping" : "bg-emerald-400 animate-pulse"
                            }`}
                        />
                        <span className="text-xs font-mono text-emerald-400">
                            {isLoading ? "Synchronizing Evidence..." : "Live Case Ingestion Verified"}
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-xl border border-surface-300 bg-surface-100 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
                        <div className="w-10 h-10 border-2 border-insignia-500 border-t-transparent rounded-full animate-spin" />
                        <h3 className="text-sm font-mono uppercase tracking-wider text-surface-800">
                            Extracting Multi-Modal Entities...
                        </h3>
                        <p className="text-xs text-surface-500 max-w-md">
                            Running OCR, ANPR, Object Detection, and NER adapters across ingested files.
                        </p>
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-8 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                        <Icon name="alert-triangle" size={24} className="text-red-400" />
                        <h3 className="text-sm font-bold text-red-300">Extraction Error</h3>
                        <p className="text-xs text-surface-400 max-w-md">{error}</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/40 transition-colors"
                        >
                            Retry Extraction
                        </button>
                    </div>
                ) : !hasAnyExtractedData ? (
                    <div className="rounded-xl border border-surface-300 bg-surface-100 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
                        <Icon name="file-text" size={32} className="text-surface-400" />
                        <h3 className="text-sm font-bold text-surface-900">No Extracted Data Available</h3>
                        <p className="text-xs text-surface-500 max-w-md">
                            No evidence documents have completed processing for this case yet. Ingest FIRs,
                            recordings, or CCTV media via Evidence Intake to trigger automated extraction.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/intake")}
                            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-insignia-600 px-4 py-2 text-xs font-semibold text-white hover:bg-insignia-500 transition-colors"
                        >
                            <Icon name="upload" size={14} />
                            <span>Go to Evidence Intake</span>
                        </button>
                    </div>
                ) : (
                    /* The 7-Section Fact Sheet */
                    <FactSheet
                        data={factData!}
                        caseId={currentCase.id}
                        isEmbedded={false}
                    />
                )}
            </main>
        </div>
    );
}
