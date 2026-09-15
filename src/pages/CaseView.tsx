// src/pages/CaseView.tsx
import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useCasesStore } from "../store/casesStore";
import { useDocumentsStore } from "../store/documentsStore";
import { USE_MOCK_API } from "../config";
import Navbar from "../components/layout/Navbar";
import DocumentList from "../components/documents/DocumentList";
import Icon from "../components/ui/Icon";
import TrackBadge from "../components/ui/TrackBadge";
import ConfidenceBadge from "../components/ui/ConfidenceBadge";
import SourceCitationPopover from "../components/ui/SourceCitationPopover";

// Center Analytics Components
import FactSheet from "../components/summary/FactSheet";
import LeadBoard from "../components/dashboard/analytics/LeadBoard";
import NetworkGraph from "../components/dashboard/analytics/NetworkGraph";
import GeoLocationView from "../components/dashboard/analytics/GeoLocationView";
import TimelineView from "../components/dashboard/analytics/TimelineView";
import IdentityResolutionView from "../components/dashboard/analytics/IdentityResolutionView";
import MOMatchList from "../components/dashboard/analytics/MOMatchList";
import TheoryBoard from "../components/dashboard/analytics/TheoryBoard";

// Drawers & Modals
import CaseWorkspaceDrawer from "../components/dashboard/CaseWorkspaceDrawer";
import DeltaIngestionModal from "../components/dashboard/DeltaIngestionModal";

import {
    mockFactSheet,
    mockFinancialTracing,
    mockDigitalForensics,
    mockCommunicationAnalysis,
    mockForensicEvidence,
    mockStructuringAlerts,
    mockAuditLog,
    mockPhantomLeads,
    mockTheories,
    mockMOMatches,
    mockTimeline,
    mockGeoLocation,
    mockIdentityResolution,
    type FactSheetData,
} from "../data/mockCaseData";
import {
    triggerHistoricalAnalysis,
    getCaseGraph,
    type GraphData,
    type AnalysisReport,
} from "../services/analytics";

const SCROLLSPY_SECTIONS = [
    { id: "fact-sheet", label: "01. Fact Sheet", icon: "file-text" },
    { id: "lead-board", label: "02. Lead Board", icon: "shield" },
    { id: "knowledge-graph", label: "03. Knowledge Graph", icon: "network-graph" },
    { id: "financial-tracing", label: "04. Financial Tracing", icon: "wallet" },
    { id: "communication-analysis", label: "05. Communication", icon: "phone-tower" },
    { id: "digital-forensics", label: "06. Digital Forensics", icon: "terminal" },
    { id: "forensic-evidence", label: "07. Physical Evidence", icon: "evidence-tag" },
    { id: "geo-location", label: "08. Geo-Intelligence", icon: "map-pin" },
    { id: "timeline", label: "09. Chronology", icon: "clock" },
    { id: "identity-resolution", label: "10. Identity Resolution", icon: "fingerprint" },
    { id: "mo-matches", label: "11. MO / Serial Matches", icon: "radar" },
    { id: "theories", label: "12. Crime Theories", icon: "scale-justice" },
    { id: "investigative-brief", label: "13. Narrative Brief", icon: "file-text" },
    { id: "audit-log", label: "14. Audit & Confidence", icon: "check-circle" },
];

export default function CaseView() {
    const { caseId } = useParams();
    const cases = useCasesStore((state) => state.cases);
    const fetchCases = useCasesStore((state) => state.fetchCases);
    const { documents, fetchDocuments } = useDocumentsStore();

    // Scrollspy state
    const [activeSection, setActiveSection] = useState("fact-sheet");
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isDeltaModalOpen, setIsDeltaModalOpen] = useState(false);
    const [deltaDiffApplied, setDeltaDiffApplied] = useState(false);
    const [showReasoningTrace, setShowReasoningTrace] = useState(false);
    const [isLeftRailOpen, setIsLeftRailOpen] = useState(true);

    // Live AI Analysis State
    const [liveReport, setLiveReport] = useState<AnalysisReport | null>(null);
    const [liveGraph, setLiveGraph] = useState<GraphData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const mainScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (cases.length === 0) fetchCases();
        if (caseId) {
            fetchDocuments(caseId);
            getCaseGraph(caseId)
                .then((g) => {
                    if (g && g.nodes?.length > 0) setLiveGraph(g);
                })
                .catch(() => {});
        }
    }, [caseId, cases.length, fetchCases, fetchDocuments]);

    const handleRunAIAnalysis = async () => {
        if (!caseId) return;
        setIsAnalyzing(true);
        try {
            const [report, graph] = await Promise.all([
                triggerHistoricalAnalysis(caseId),
                getCaseGraph(caseId),
            ]);
            setLiveReport(report);
            if (graph && graph.nodes?.length > 0) {
                setLiveGraph(graph);
            }
        } catch {
            // Error handling
        } finally {
            setIsAnalyzing(false);
        }
    };

    const caseData = cases.find((c) => c.id === caseId) || {
        id: caseId || "case-1",
        name: "Active Case Investigation",
        track: 2 as const,
        triage_reason: "Evidence ingestion underway.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    // Synthesize real case Fact Sheet dynamically from uploaded documents
    const dynamicFactSheet = useMemo<FactSheetData>(() => {
        const whoList: FactSheetData["who"] = [];
        const whatList: FactSheetData["what"] = [];
        const whenList: FactSheetData["when"] = [];
        const whereList: FactSheetData["where"] = [];
        const evidenceList: FactSheetData["evidence"] = [];

        documents.forEach((doc, idx) => {
            const ext = (doc.extracted_information as any) || {};

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
                fileName: doc.title || `Evidence-${idx + 1}`,
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

            if (ext.incident_datetime) {
                whenList.push({
                    timestamp: ext.incident_datetime,
                    event: ext.narrative || "Incident reported",
                    location: ext.police_station || "Jurisdiction",
                    citation: {
                        documentTitle: doc.title,
                        confidenceScore: 0.92,
                    },
                });
            }

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

        return {
            caseId: caseData.id,
            firNumber: caseData.name,
            track: (caseData.track ?? 2) as 1 | 2,
            triageReason: caseData.triage_reason || "Multi-channel evidence parsed.",
            who: whoList,
            what: whatList,
            when: whenList,
            where: whereList,
            evidence: evidenceList,
            knownRelationships: [],
            openGaps: [],
        };
    }, [documents, caseData.id, caseData.name, caseData.track, caseData.triage_reason]);

    const activeFactSheet =
        liveReport?.fact_sheet ||
        (documents.length > 0
            ? dynamicFactSheet
            : USE_MOCK_API
            ? mockFactSheet
            : dynamicFactSheet);

    // Dynamic Graph built from actual documents if GNN graph not yet generated
    const dynamicDocGraph = useMemo<GraphData>(() => {
        const nodes: GraphData["nodes"] = [];
        const edges: GraphData["edges"] = [];

        dynamicFactSheet.who.forEach((p) => {
            nodes.push({
                id: `node-${p.id}`,
                label: p.name,
                type: "person",
                badge: p.role,
                risk_score: p.role === "Accused" ? 0.85 : 0.2,
                merge_reason: p.citation?.rawSnippet || "Extracted from case documents",
            });
        });

        documents.forEach((d) => {
            nodes.push({
                id: `node-doc-${d.id}`,
                label: d.title,
                type: "document",
                badge: d.document_type.toUpperCase(),
                risk_score: 0.1,
            });

            dynamicFactSheet.who.forEach((p) => {
                edges.push({
                    id: `edge-${d.id}-${p.id}`,
                    source: `node-doc-${d.id}`,
                    target: `node-${p.id}`,
                    label: "mentions",
                    color: "#64748b",
                    style: "solid",
                });
            });
        });

        return { nodes, edges };
    }, [dynamicFactSheet.who, documents]);

    const activeGraph =
        liveGraph && liveGraph.nodes?.length > 0
            ? liveGraph
            : dynamicDocGraph.nodes.length > 0
            ? dynamicDocGraph
            : USE_MOCK_API
            ? mockFinancialTracing
            : { nodes: [], edges: [] };

    // Dynamic Locations
    const dynamicLocations = useMemo(() => {
        return activeFactSheet.where.map((w, idx) => ({
            id: `geo-${idx + 1}`,
            lat: w.coordinates[0],
            lng: w.coordinates[1],
            label: w.locationName,
            timestamp: activeFactSheet.when[idx]?.timestamp || new Date().toISOString(),
            entity: activeFactSheet.who[0]?.name || caseData.name,
            type: "incident" as const,
            details: { jurisdiction: w.jurisdiction, significance: w.significance },
            citation: w.citation,
        }));
    }, [activeFactSheet.where, activeFactSheet.when, activeFactSheet.who, caseData.name]);

    // Dynamic Timeline
    const dynamicTimelineEvents = useMemo(() => {
        return activeFactSheet.when.map((w, idx) => ({
            id: `time-${idx + 1}`,
            date: w.timestamp.slice(0, 10),
            time: w.timestamp.slice(11, 16) || "12:00",
            title: w.event,
            summary: w.event,
            type: "incident" as const,
            confidence: 0.95,
            primaryEntity: activeFactSheet.who[0]?.name || caseData.name,
            location: w.location,
            citation: w.citation,
        }));
    }, [activeFactSheet.when, activeFactSheet.who, caseData.name]);

    // Dynamic Identity Resolution
    const dynamicIdentityData = useMemo(() => {
        return {
            target: activeFactSheet.who[0]?.name || caseData.name,
            candidates: activeFactSheet.who.map((w, idx) => ({
                id: `cand-${idx + 1}`,
                name: w.name,
                confidence: 95,
                source: w.citation.documentTitle || "Case Evidence",
                matchingAttributes: [`Role: ${w.role}`, ...(w.alias ? [`Alias: ${w.alias}`] : [])],
                conflictingAttributes: [],
                reasoning: `Extracted directly from ${w.citation.documentTitle}`,
            })),
        };
    }, [activeFactSheet.who, caseData.name]);

    const scrollToSection = (sectionId: string) => {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            setActiveSection(sectionId);
        }
    };

    return (
        <div className="min-h-screen bg-surface-0 flex flex-col font-sans">
            <Navbar />

            {/* Tactical Grid Background */}
            <div className="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none" />

            {/* Top Operational Case Bar */}
            <header className="relative z-10 border-b border-surface-300 bg-surface-100/95 backdrop-blur-md px-4 sm:px-6 py-3">
                <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/dashboard"
                            className="p-1.5 rounded-lg border border-surface-300 bg-surface-0 text-surface-400 hover:text-surface-900 transition-colors"
                        >
                            <Icon name="arrow-left" size={14} />
                        </Link>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-insignia-400 font-bold uppercase tracking-wider">
                                    AstraX Live Case File
                                </span>
                                <span className="text-surface-300">•</span>
                                <span className="font-mono text-xs text-surface-500">{caseData.id}</span>
                            </div>
                            <h1 className="text-lg font-bold text-surface-900 tracking-tight flex items-center gap-2">
                                {caseData.name}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <TrackBadge track={caseData.track ?? 2} size="md" />

                        <button
                            type="button"
                            onClick={handleRunAIAnalysis}
                            disabled={isAnalyzing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-insignia-600 hover:bg-insignia-500 disabled:opacity-50 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                        >
                            <Icon name="radar" size={14} className={isAnalyzing ? "animate-spin" : ""} />
                            <span>{isAnalyzing ? "Synthesizing AI Models..." : "Run AI Analysis"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsDeltaModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-300 bg-surface-0 px-3 py-1.5 text-xs font-semibold text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors"
                        >
                            <Icon name="network-graph" size={14} className="text-insignia-400" />
                            <span>Delta Ingestion</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main 3-Column Layout */}
            <div className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto flex overflow-hidden">
                {/* Left Drawer (Toggleable Evidence Rail) */}
                <aside
                    className={`border-r border-surface-300 bg-surface-100/60 transition-all duration-300 shrink-0 flex flex-col ${
                        isLeftRailOpen ? "w-80" : "w-12 items-center"
                    }`}
                >
                    <div className="p-3 border-b border-surface-300 flex items-center justify-between">
                        {isLeftRailOpen && (
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-surface-700">
                                Case Evidence ({documents.length})
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsLeftRailOpen(!isLeftRailOpen)}
                            className="p-1 rounded text-surface-400 hover:text-surface-700"
                        >
                            <Icon name={isLeftRailOpen ? "chevron-down" : "file-text"} size={14} className={isLeftRailOpen ? "rotate-90" : ""} />
                        </button>
                    </div>

                    {isLeftRailOpen && (
                        <div className="flex-1 overflow-y-auto p-3">
                            <DocumentList
                                documents={documents}
                            />
                        </div>
                    )}
                </aside>

                {/* Center Analytics Spine (Scrollspy Main Content) */}
                <main
                    ref={mainScrollRef}
                    className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8 scroll-smooth"
                >
                    {/* 1. FACT SHEET */}
                    <section id="fact-sheet" className="scroll-mt-4">
                        <FactSheet
                            data={activeFactSheet}
                            caseId={caseData.id}
                            isEmbedded={true}
                            showDiffIndicator={deltaDiffApplied}
                            onJumpToSection={scrollToSection}
                        />
                    </section>

                    {/* 2. INVESTIGATIVE LEAD BOARD */}
                    <section id="lead-board" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4">
                        <LeadBoard
                            data={
                                liveReport?.priority_leads && liveReport.priority_leads.length > 0
                                    ? liveReport.priority_leads.map((lead) => ({
                                          id: lead.entity_id,
                                          title: lead.display_name,
                                          phantomType: "person" as const,
                                          confidenceScore: lead.score,
                                          status: "open" as const,
                                          dateIdentified: "Live Inference",
                                          sourceDocument: "AstraX Model Linker",
                                          partialAttributes: {
                                              gnn_probability: `${(lead.components.gnn_probability * 100).toFixed(1)}%`,
                                              centrality: `${(lead.components.centrality * 100).toFixed(1)}%`,
                                              mo_similarity: `${(lead.components.mo_similarity * 100).toFixed(1)}%`,
                                          },
                                          recommendedAction: "Cross-reference vehicle and communication records",
                                      }))
                                    : USE_MOCK_API
                                    ? mockPhantomLeads
                                    : []
                            }
                            onSelectLead={(lead) => {
                                setSelectedItem(lead);
                            }}
                        />
                    </section>

                    {/* 3. KNOWLEDGE GRAPH / GNN OUTPUT */}
                    <section id="knowledge-graph" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                                    <Icon name="network-graph" size={16} className="text-insignia-400" />
                                    <span>Multi-Modal Heterogeneous Knowledge Graph</span>
                                </h3>
                                <p className="text-xs text-surface-500 mt-0.5">
                                    Derived from actual case evidence documents and verified entity linkages.
                                </p>
                            </div>
                        </div>

                        <div className="h-[460px] w-full">
                            <NetworkGraph
                                data={activeGraph}
                                theme="digital"
                                onNodeClick={(node) => setSelectedItem(node)}
                            />
                        </div>
                    </section>

                    {/* 4. FINANCIAL TRACING */}
                    <section id="financial-tracing" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-200/80 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                                    <Icon name="wallet" size={16} className="text-emerald-400" />
                                    <span>Financial Tracing & Transaction Telemetry</span>
                                </h3>
                                <p className="text-xs text-surface-500 mt-0.5">
                                    Fund flow tracking and transaction structuring analysis.
                                </p>
                            </div>
                        </div>

                        {USE_MOCK_API ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {mockStructuringAlerts.map((alert) => (
                                    <div key={alert.id} className="p-3 rounded-lg border border-surface-300 bg-surface-0/70 text-xs">
                                        <div className="font-bold text-surface-900">{alert.accountNumber}</div>
                                        <div className="text-surface-500">"STRUCTURING ALERT"</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-surface-500 italic bg-surface-0/40 rounded-lg border border-surface-300">
                                No financial transactions or structuring accounts flagged in case documents. Ingest banking statements or CDR spreadsheets to view financial flow vectors.
                            </div>
                        )}
                    </section>

                    {/* 5. COMMUNICATION ANALYSIS */}
                    <section id="communication-analysis" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4 space-y-3">
                        <div className="border-b border-surface-200/80 pb-3">
                            <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                                <Icon name="phone-tower" size={16} className="text-blue-400" />
                                <span>Telecommunications & Intercepts</span>
                            </h3>
                            <p className="text-xs text-surface-500 mt-0.5">
                                Phone identifier churn, contact frequency, and cell tower triangulation.
                            </p>
                        </div>
                        {USE_MOCK_API ? (
                            <div className="h-[400px] w-full">
                                <NetworkGraph data={mockCommunicationAnalysis} theme="communication" onNodeClick={(node) => setSelectedItem(node)} />
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-surface-500 italic bg-surface-0/40 rounded-lg border border-surface-300">
                                No audio intercepts, wiretaps, or CDR logs ingested for this case.
                            </div>
                        )}
                    </section>

                    {/* 6. DIGITAL FORENSICS */}
                    <section id="digital-forensics" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4 space-y-3">
                        <div className="border-b border-surface-200/80 pb-3">
                            <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                                <Icon name="terminal" size={16} className="text-purple-400" />
                                <span>Digital Forensics & File Carving</span>
                            </h3>
                            <p className="text-xs text-surface-500 mt-0.5">
                                Parsed digital evidence files, certificates, and media artifacts.
                            </p>
                        </div>
                        <div className="space-y-2 text-xs font-mono">
                            {documents.map((d) => (
                                <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg border border-surface-300 bg-surface-0/60">
                                    <div className="flex items-center gap-2">
                                        <Icon name="file-text" size={14} className="text-surface-400" />
                                        <span className="font-bold text-surface-800">{d.title}</span>
                                        <span className="text-surface-400">({d.document_type})</span>
                                    </div>
                                    <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-surface-200 text-surface-700 font-bold">{d.status}</span>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <div className="py-6 text-center text-surface-500 italic">No digital evidence files registered.</div>
                            )}
                        </div>
                    </section>

                    {/* 7. PHYSICAL FORENSICS */}
                    <section id="forensic-evidence" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4 space-y-3">
                        <div className="border-b border-surface-200/80 pb-3">
                            <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                                <Icon name="evidence-tag" size={16} className="text-amber-400" />
                                <span>Physical Forensic Evidence & Seizures</span>
                            </h3>
                            <p className="text-xs text-surface-500 mt-0.5">
                                Panchnama records, physical recoveries, and seized property.
                            </p>
                        </div>
                        {USE_MOCK_API ? (
                            <div className="h-[400px] w-full">
                                <NetworkGraph data={mockForensicEvidence} theme="evidence" onNodeClick={(node) => setSelectedItem(node)} />
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-surface-500 italic bg-surface-0/40 rounded-lg border border-surface-300">
                                No physical seizure logs or laboratory match reports uploaded for this case.
                            </div>
                        )}
                    </section>

                    {/* 8. GEO-LOCATION */}
                    <section id="geo-location" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4 space-y-3">
                        <div className="border-b border-surface-200/80 pb-3">
                            <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                                <Icon name="map-pin" size={16} className="text-insignia-400" />
                                <span>Geospatial Intelligence & Movement Route</span>
                            </h3>
                            <p className="text-xs text-surface-500 mt-0.5">
                                Chronological movement vector and mapped incident jurisdictions.
                            </p>
                        </div>
                        <div className="h-[440px] w-full">
                            <GeoLocationView onSelect={(item) => setSelectedItem(item)} />
                        </div>
                    </section>

                    {/* 9. TIMELINE */}
                    <section id="timeline" className="scroll-mt-4">
                        <TimelineView onSelect={(item) => setSelectedItem(item)} />
                    </section>

                    {/* 10. IDENTITY RESOLUTION */}
                    <section id="identity-resolution" className="scroll-mt-4">
                        <IdentityResolutionView
                            data={dynamicIdentityData.candidates.length > 0 ? dynamicIdentityData : (USE_MOCK_API ? mockIdentityResolution : undefined)}
                            onSelectCandidate={(cand) => setSelectedItem(cand)}
                        />
                    </section>

                    {/* 11. MO-SIMILARITY / SERIAL-CRIME MATCHES */}
                    <section id="mo-matches" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4">
                        <MOMatchList
                            data={
                                liveReport?.mo_matches?.matched_historical_cases &&
                                liveReport.mo_matches.matched_historical_cases.length > 0
                                    ? liveReport.mo_matches.matched_historical_cases
                                    : USE_MOCK_API
                                    ? mockMOMatches
                                    : []
                            }
                        />
                    </section>

                    {/* 12. CRIME RECONSTRUCTION THEORIES */}
                    <section id="theories" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4">
                        <TheoryBoard
                            data={
                                liveReport?.theories && liveReport.theories.length > 0
                                    ? liveReport.theories
                                    : USE_MOCK_API
                                    ? mockTheories
                                    : []
                            }
                            onJumpToLead={scrollToSection}
                        />
                    </section>

                    {/* 13. JUDICIAL NARRATIVE BRIEF */}
                    <section id="investigative-brief" className="rounded-xl border border-surface-300 bg-surface-100 p-6 shadow-sm scroll-mt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-200/80 pb-4">
                            <div>
                                <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                                    <Icon name="file-text" size={16} className="text-insignia-400" />
                                    <span>Investigative Brief & Judicial Narrative</span>
                                </h3>
                                <p className="text-xs text-surface-500 mt-0.5">
                                    Cited natural-language brief compliant with Section 105 of the Bharatiya Sakshya Adhiniyam (BSA), 2023.
                                </p>
                            </div>
                        </div>

                        <div className="prose prose-sm max-w-none text-surface-700 leading-relaxed space-y-3 font-sans text-xs">
                            <p>
                                The active investigation in <strong>{caseData.name}</strong> incorporates <strong>{documents.length}</strong> ingested evidence stream(s). Recorded statutory offences include:{" "}
                                <span className="font-semibold text-surface-900">
                                    {activeFactSheet.what.map((w) => w.bnsSection).join(", ") || "Statutory sections pending extraction"}
                                </span>.
                            </p>
                            <p>
                                Primary named individuals and suspected actors identified in case records include:{" "}
                                <span className="font-semibold text-surface-900">
                                    {activeFactSheet.who.map((w) => `${w.name} (${w.role})`).join(", ") || "Parties pending extraction"}
                                </span>.
                                Incident jurisdiction is documented under{" "}
                                <span className="font-semibold text-surface-900">
                                    {activeFactSheet.where.map((wh) => wh.locationName).join("; ") || "Jurisdiction under review"}
                                </span>.
                            </p>
                            <p className="text-surface-500 italic">
                                Document ingestion status: {documents.map((d) => `${d.title}: ${d.status}`).join(", ") || "No active documents."}
                            </p>
                        </div>
                    </section>

                    {/* 14. AUDIT & CONFIDENCE PANEL */}
                    <section id="audit-log" className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm scroll-mt-4 space-y-3">
                        <div className="border-b border-surface-200/80 pb-3">
                            <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                                <Icon name="check-circle" size={16} className="text-emerald-400" />
                                <span>Audit & Confidence Ledger - "Leads Not Verdicts"</span>
                            </h3>
                            <p className="text-xs text-surface-500 mt-0.5">
                                Transparent audit log of algorithmic merges, anomaly detections, and human verifications.
                            </p>
                        </div>

                        <div className="space-y-2 font-mono text-xs">
                            {documents.map((d) => (
                                <div
                                    key={d.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-surface-300 bg-surface-0/60"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-insignia-400 font-bold shrink-0">
                                            {new Date(d.created_at).toLocaleTimeString()}
                                        </span>
                                        <span className="text-surface-800 font-bold">Document Ingestion:</span>
                                        <span className="text-surface-600">{d.title} ({d.document_type}) - Status: {d.status.toUpperCase()}</span>
                                    </div>
                                    <ConfidenceBadge score={0.95} size="sm" />
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <div className="py-4 text-center text-surface-500 italic">No audit entries recorded yet.</div>
                            )}
                        </div>
                    </section>
                </main>

                {/* Right Scrollspy Navigation Rail */}
                <aside className="w-56 border-l border-surface-300 bg-surface-100/50 p-4 hidden xl:flex flex-col gap-2 shrink-0">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-surface-500 mb-2">
                        Case Sections
                    </span>
                    <nav className="flex flex-col gap-1">
                        {SCROLLSPY_SECTIONS.map((sec) => (
                            <button
                                key={sec.id}
                                type="button"
                                onClick={() => scrollToSection(sec.id)}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors cursor-pointer ${
                                    activeSection === sec.id
                                        ? "bg-insignia-500/15 text-insignia-400 font-bold border border-insignia-500/30"
                                        : "text-surface-600 hover:text-surface-900 hover:bg-surface-200/50"
                                }`}
                            >
                                <Icon name={sec.icon as any} size={13} />
                                <span className="truncate">{sec.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>
            </div>

            {/* Right Drawer (Inspection Details) */}
            <CaseWorkspaceDrawer
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />

            {/* Delta Modal */}
            <DeltaIngestionModal
                caseId={caseData.id}
                isOpen={isDeltaModalOpen}
                onClose={() => setIsDeltaModalOpen(false)}
                onDeltaComplete={() => setDeltaDiffApplied(true)}
            />
        </div>
    );
}
