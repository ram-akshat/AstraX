// src/components/summary/FactSheet.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import Icon, { type IconName } from "../ui/Icon";
import TrackBadge from "../ui/TrackBadge";
import ConfidenceBadge from "../ui/ConfidenceBadge";
import SourceCitationPopover from "../ui/SourceCitationPopover";
import { mockFactSheet, type FactSheetData } from "../../data/mockCaseData";
import { USE_MOCK_API } from "../../config";

interface FactSheetProps {
    data?: FactSheetData;
    caseId?: string;
    isEmbedded?: boolean;
    showDiffIndicator?: boolean;
    onJumpToSection?: (sectionId: string) => void;
}

export default function FactSheet({
    data,
    caseId = "case-1",
    isEmbedded = false,
    showDiffIndicator = false,
    onJumpToSection,
}: FactSheetProps) {
    const emptyFactSheet: FactSheetData = {
        caseId: caseId || "case-1",
        firNumber: "No Case Record Selected",
        track: 2,
        triageReason: "Awaiting document ingestion.",
                who: [],
        what: [],
        when: [],
        where: [],
        evidence: [],
        knownRelationships: [],
        openGaps: [],
    };
    const activeData = data || (USE_MOCK_API ? mockFactSheet : emptyFactSheet);
    // Collapsible states for all 7 sections
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
        who: false,
        what: false,
        when: false,
        where: false,
        evidence: false,
        relationships: false,
        gaps: false,
    });

    const toggleSection = (sec: string) => {
        setCollapsed((prev) => ({ ...prev, [sec]: !prev[sec] }));
    };

    const isTrack1 = activeData.track === 1;

    const modalityIcons: Record<string, IconName> = {
        digital_text: "file-text",
        scanned_doc: "evidence-tag",
        video_cctv: "video-cctv",
        audio: "audio-mic",
        cdr_financial: "cdr-table",
        image_bio: "image-bio",
    };

    return (
        <div className="flex flex-col gap-6 font-sans">
            {/* Top Case Context & Track Badge Banner */}
            <div className="rounded-xl border border-surface-300 bg-surface-100 p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-surface-900 tracking-tight">
                                Stage 5: Case Fact-Sheet
                            </h2>
                            <TrackBadge track={activeData.track} triageReason={activeData.triageReason} />
                        </div>
                        <p className="text-xs font-mono text-surface-500">
                            Identifier: <span className="text-surface-800">{activeData.firNumber}</span> • Standardized Case Record
                        </p>
                    </div>

                    {!isEmbedded && !isTrack1 && (
                        <Link
                            to={`/cases/${caseId}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-insignia-500 hover:bg-insignia-400 text-surface-0 font-bold px-5 py-2.5 text-xs transition-all shadow-md shadow-insignia-500/20 cursor-pointer"
                        >
                            <span>Open Full Analysis Dashboard</span>
                            <Icon name="arrow-right" size={14} />
                        </Link>
                    )}
                </div>

                <div className="mt-4 pt-3 border-t border-surface-200/80 text-xs text-surface-600 flex items-center gap-2">
                    <Icon name="radar" size={13} className="text-insignia-400 shrink-0" />
                    <span><strong>Triage Rationale:</strong> {activeData.triageReason}</span>
                </div>

                {/* Diff Indicator (for re-diffed views on new evidence) */}
                {(showDiffIndicator || activeData.diffSummary) && activeData.diffSummary && (
                    <div className="mt-3 rounded-lg border border-insignia-500/40 bg-insignia-500/10 p-3 text-xs text-insignia-300 flex items-start gap-2.5">
                        <Icon name="refresh" size={14} className="text-insignia-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <span className="font-bold text-insignia-300">
                                {activeData.diffSummary.updatedCount} facts updated since initial ingestion
                            </span>
                            <ul className="mt-1 space-y-0.5 list-disc list-inside text-surface-400 text-[11px]">
                                {activeData.diffSummary.details.map((d, i) => (
                                    <li key={i}>{d}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Track 1 Honest Empty-State Handling */}
            {isTrack1 ? (
                <div className="rounded-xl border border-surface-300 bg-surface-100 p-8 text-center flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-surface-200 flex items-center justify-center text-surface-400 mb-3">
                        <Icon name="shield" size={24} />
                    </div>
                    <h3 className="text-base font-bold text-surface-900">
                        Routine Incident Classification (Track 1)
                    </h3>
                    <p className="mt-2 text-sm text-surface-500 max-w-md">
                        No network signal detected — logged for future cross-reference. Graph neural network expansion and hypothesis generation are disabled to maintain prosecutorial evidentiary integrity.
                    </p>
                    <div className="mt-6 flex gap-3">
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 rounded-lg border border-surface-300 bg-surface-200 text-xs font-semibold text-surface-700 hover:text-white"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            ) : (
                /* The 7 Stage 5 Fact-Sheet Sections */
                <div className="space-y-4">
                    {/* 1. WHO */}
                    <div className="rounded-xl border border-surface-300 bg-surface-100 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("who")}
                            className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-surface-200/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-insignia-400 bg-insignia-500/15 px-2 py-0.5 rounded border border-insignia-500/30">
                                    01
                                </span>
                                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                                    Who — Named Entities & Roles
                                </h3>
                                <span className="text-xs font-mono text-surface-500">
                                    ({activeData.who.length} individuals / phantoms identified)
                                </span>
                            </div>
                            <Icon
                                name={collapsed.who ? "chevron-down" : "chevron-down"}
                                size={16}
                                className={`text-surface-400 transition-transform ${collapsed.who ? "-rotate-90" : ""}`}
                            />
                        </button>

                        {!collapsed.who && (
                            <div className="p-4 pt-0 border-t border-surface-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                {activeData.who.map((person) => {
                                    const isPhantom = person.isPhantom || person.role === "Unresolved-Phantom";

                                    return (
                                        <div
                                            key={person.id}
                                            className={`rounded-lg p-3 text-xs flex flex-col justify-between gap-2 border ${
                                                isPhantom
                                                    ? "border-purple-500/50 bg-purple-950/20 border-dashed"
                                                    : "border-surface-300 bg-surface-0/70"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="font-bold text-surface-900 truncate flex items-center gap-1.5">
                                                        <span>{person.name}</span>
                                                    </div>
                                                    {person.alias && (
                                                        <div className="text-[11px] text-surface-500 truncate">
                                                            alias: {person.alias}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Role Chip */}
                                                {isPhantom ? (
                                                    <span className="inline-flex items-center gap-1 rounded bg-purple-950/60 text-purple-300 border border-purple-500/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold">
                                                        <span>?</span>
                                                        <span>Lead</span>
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                            person.role === "Accused"
                                                                ? "bg-red-950/70 text-red-300 border border-red-500/30"
                                                                : person.role === "Complainant"
                                                                  ? "bg-blue-950/70 text-blue-300 border border-blue-500/30"
                                                                  : "bg-surface-200 text-surface-600 border border-surface-300"
                                                        }`}
                                                    >
                                                        {person.role}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between border-t border-surface-200/60 pt-2 text-[10px] text-surface-500">
                                                <span className="font-mono">{person.citation.documentTitle}</span>
                                                <SourceCitationPopover source={person.citation} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 2. WHAT */}
                    <div className="rounded-xl border border-surface-300 bg-surface-100 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("what")}
                            className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-surface-200/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-insignia-400 bg-insignia-500/15 px-2 py-0.5 rounded border border-insignia-500/30">
                                    02
                                </span>
                                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                                    What — Offences & Statutory Sections (BNS 2023)
                                </h3>
                                <span className="text-xs font-mono text-surface-500">
                                    ({activeData.what.length} statutory charges)
                                </span>
                            </div>
                            <Icon
                                name={collapsed.what ? "chevron-down" : "chevron-down"}
                                size={16}
                                className={`text-surface-400 transition-transform ${collapsed.what ? "-rotate-90" : ""}`}
                            />
                        </button>

                        {!collapsed.what && (
                            <div className="p-4 pt-0 border-t border-surface-200/70 space-y-3 mt-3">
                                {activeData.what.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border border-surface-300 bg-surface-0/70 p-3.5 text-xs flex flex-col gap-2"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-insignia-400 text-sm">
                                                    {item.bnsSection}
                                                </span>
                                                <span className="font-semibold text-surface-900">
                                                    — {item.statuteName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-surface-500 font-mono text-[11px]">
                                                    Applicable to: <strong className="text-surface-700">{item.applicableTo}</strong>
                                                </span>
                                                <SourceCitationPopover source={item.citation} />
                                            </div>
                                        </div>
                                        <p className="text-surface-600 leading-relaxed bg-surface-100/70 rounded p-2 border border-surface-200 font-mono text-[11px]">
                                            "{item.description}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. WHEN */}
                    <div className="rounded-xl border border-surface-300 bg-surface-100 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("when")}
                            className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-surface-200/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-insignia-400 bg-insignia-500/15 px-2 py-0.5 rounded border border-insignia-500/30">
                                    03
                                </span>
                                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                                    When — Incident Chronology Highlights
                                </h3>
                                <span className="text-xs font-mono text-surface-500">
                                    ({activeData.when.length} key timestamps)
                                </span>
                            </div>
                            <Icon
                                name={collapsed.when ? "chevron-down" : "chevron-down"}
                                size={16}
                                className={`text-surface-400 transition-transform ${collapsed.when ? "-rotate-90" : ""}`}
                            />
                        </button>

                        {!collapsed.when && (
                            <div className="p-4 pt-0 border-t border-surface-200/70 space-y-2 mt-3">
                                <div className="space-y-2 font-mono text-xs">
                                    {activeData.when.map((event, idx) => (
                                        <div
                                            key={idx}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-surface-300 bg-surface-0/60"
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <span className="text-insignia-400 font-bold shrink-0">
                                                    {event.timestamp}
                                                </span>
                                                <span className="text-surface-700">
                                                    {event.event}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 text-surface-500">
                                                <span className="text-[11px] bg-surface-200 px-2 py-0.5 rounded">
                                                    {event.location}
                                                </span>
                                                <SourceCitationPopover source={event.citation} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {onJumpToSection && (
                                    <button
                                        type="button"
                                        onClick={() => onJumpToSection("timeline")}
                                        className="text-xs font-semibold text-insignia-400 hover:underline pt-2 inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>View full interactive chronology in Timeline section</span>
                                        <Icon name="chevron-right" size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. WHERE */}
                    <div className="rounded-xl border border-surface-300 bg-surface-100 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("where")}
                            className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-surface-200/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-insignia-400 bg-insignia-500/15 px-2 py-0.5 rounded border border-insignia-500/30">
                                    04
                                </span>
                                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                                    Where — Geographical Footprint & Jurisdictions
                                </h3>
                                <span className="text-xs font-mono text-surface-500">
                                    ({activeData.where.length} locations mapped)
                                </span>
                            </div>
                            <Icon
                                name={collapsed.where ? "chevron-down" : "chevron-down"}
                                size={16}
                                className={`text-surface-400 transition-transform ${collapsed.where ? "-rotate-90" : ""}`}
                            />
                        </button>

                        {!collapsed.where && (
                            <div className="p-4 pt-0 border-t border-surface-200/70 grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                {activeData.where.map((loc, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border border-surface-300 bg-surface-0/70 p-3 text-xs flex flex-col justify-between gap-2"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="font-bold text-surface-900">
                                                    {loc.locationName}
                                                </div>
                                                <SourceCitationPopover source={loc.citation} />
                                            </div>
                                            <div className="text-[11px] text-surface-500 mt-1 font-mono">
                                                {loc.jurisdiction}
                                            </div>
                                        </div>
                                        <p className="text-surface-600 text-[11px] leading-relaxed">
                                            {loc.significance}
                                        </p>
                                        <div className="font-mono text-[10px] text-insignia-400 pt-1 border-t border-surface-200">
                                            [{loc.coordinates[0].toFixed(4)}, {loc.coordinates[1].toFixed(4)}]
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 5. EVIDENCE ON FILE */}
                    <div className="rounded-xl border border-surface-300 bg-surface-100 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("evidence")}
                            className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-surface-200/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-insignia-400 bg-insignia-500/15 px-2 py-0.5 rounded border border-insignia-500/30">
                                    05
                                </span>
                                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                                    Evidence on File — Ingestion Verification
                                </h3>
                                <span className="text-xs font-mono text-surface-500">
                                    ({activeData.evidence.length} files parsed)
                                </span>
                            </div>
                            <Icon
                                name={collapsed.evidence ? "chevron-down" : "chevron-down"}
                                size={16}
                                className={`text-surface-400 transition-transform ${collapsed.evidence ? "-rotate-90" : ""}`}
                            />
                        </button>

                        {!collapsed.evidence && (
                            <div className="p-4 pt-0 border-t border-surface-200/70 space-y-2 mt-3">
                                {activeData.evidence.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-surface-300 bg-surface-0/70 text-xs"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded bg-surface-200 text-surface-400">
                                                <Icon name={modalityIcons[item.modality] || "file-text"} size={14} />
                                            </div>
                                            <div>
                                                <div className="font-mono font-semibold text-surface-800">
                                                    {item.fileName}
                                                </div>
                                                <div className="text-[11px] text-surface-500">
                                                    {item.note}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <ConfidenceBadge score={item.confidence} size="sm" />
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                                    item.extractionStatus === "parsed"
                                                        ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/30"
                                                        : item.extractionStatus === "partial"
                                                          ? "bg-amber-950/70 text-amber-300 border border-amber-500/30"
                                                          : "bg-red-950/70 text-red-300 border border-red-500/30"
                                                }`}
                                            >
                                                {item.extractionStatus}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 6. KNOWN RELATIONSHIPS */}
                    <div className="rounded-xl border border-surface-300 bg-surface-100 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("relationships")}
                            className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-surface-200/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-insignia-400 bg-insignia-500/15 px-2 py-0.5 rounded border border-insignia-500/30">
                                    06
                                </span>
                                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                                    Known Relationships — Evidentiary Graph Base
                                </h3>
                                <span className="text-xs font-mono text-surface-500">
                                    ({activeData.knownRelationships.length} verified connections • no hypotheses)
                                </span>
                            </div>
                            <Icon
                                name={collapsed.relationships ? "chevron-down" : "chevron-down"}
                                size={16}
                                className={`text-surface-400 transition-transform ${collapsed.relationships ? "-rotate-90" : ""}`}
                            />
                        </button>

                        {!collapsed.relationships && (
                            <div className="p-4 pt-0 border-t border-surface-200/70 space-y-2 mt-3">
                                {activeData.knownRelationships.map((rel) => (
                                    <div
                                        key={rel.id}
                                        className="flex items-center justify-between p-2.5 rounded-lg border border-surface-300 bg-surface-0/60 text-xs font-mono"
                                    >
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-surface-900">{rel.source}</span>
                                            <span className="text-insignia-400 font-bold">──[ {rel.relationship} ]──&gt;</span>
                                            <span className="font-bold text-surface-900">{rel.target}</span>
                                        </div>
                                        <SourceCitationPopover source={rel.citation} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 7. OPEN GAPS */}
                    <div className="rounded-xl border border-surface-300 bg-surface-100 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("gaps")}
                            className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-surface-200/50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-500/30">
                                    07
                                </span>
                                <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
                                    Open Gaps — Investigative Deficits & Phantom Entities
                                </h3>
                                <span className="text-xs font-mono text-surface-500">
                                    ({activeData.openGaps.length} unresolved slots linking to Lead Board)
                                </span>
                            </div>
                            <Icon
                                name={collapsed.gaps ? "chevron-down" : "chevron-down"}
                                size={16}
                                className={`text-surface-400 transition-transform ${collapsed.gaps ? "-rotate-90" : ""}`}
                            />
                        </button>

                        {!collapsed.gaps && (
                            <div className="p-4 pt-0 border-t border-surface-200/70 space-y-3 mt-3">
                                {activeData.openGaps.map((gap) => (
                                    <div
                                        key={gap.id}
                                        className="rounded-lg border border-purple-500/40 bg-purple-950/20 border-dashed p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-purple-900/60 text-purple-300 font-mono text-xs font-bold mt-0.5">
                                                ?
                                            </span>
                                            <div>
                                                <div className="font-bold text-surface-900">
                                                    {gap.title}
                                                </div>
                                                <div className="text-[11px] text-surface-400 mt-0.5">
                                                    {gap.notes}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                                    gap.severity === "critical"
                                                        ? "bg-red-950 text-red-300 border border-red-500/40"
                                                        : "bg-amber-950 text-amber-300 border border-amber-500/40"
                                                }`}
                                            >
                                                {gap.severity} gap
                                            </span>
                                            {onJumpToSection && (
                                                <button
                                                    type="button"
                                                    onClick={() => onJumpToSection("leadboard")}
                                                    className="inline-flex items-center gap-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 px-2 py-1 text-[10px] font-mono transition-colors cursor-pointer"
                                                >
                                                    <span>View on Lead Board</span>
                                                    <Icon name="arrow-right" size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
