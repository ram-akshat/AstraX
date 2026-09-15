// src/components/dashboard/analytics/TheoryBoard.tsx
import { useState, useEffect } from "react";
import Icon from "../../ui/Icon";
import ConfidenceBadge from "../../ui/ConfidenceBadge";
import SourceCitationPopover from "../../ui/SourceCitationPopover";
import { mockTheories, type CrimeTheory } from "../../../data/mockCaseData";

interface TheoryBoardProps {
    onJumpToLead?: (leadId: string) => void;
    data?: CrimeTheory[];
}

import { USE_MOCK_API } from "../../../config";

export default function TheoryBoard({ onJumpToLead, data }: TheoryBoardProps) {
    const [theories, setTheories] = useState<CrimeTheory[]>(data !== undefined ? data : (USE_MOCK_API ? mockTheories : []));
    const [activeVersion, setActiveVersion] = useState<string>(data && data[0] ? data[0].version : "v1");

    useEffect(() => {
        if (data !== undefined) {
            setTheories(data);
            if (data[0]) setActiveVersion(data[0].version);
        }
    }, [data]);

    const currentTheory = theories.find((t) => t.version === activeVersion) || theories[0];

    return (
        <div className="flex flex-col gap-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-300 pb-3">
                <div>
                    <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                        <Icon name="scale-justice" size={16} className="text-insignia-400" />
                        <span>Crime Reconstruction Theories</span>
                    </h3>
                    <p className="text-xs text-surface-500 mt-0.5">
                        Multi-hypothesis event sequence synthesized by link analysis models.
                    </p>
                </div>

                {/* Version History Selector */}
                <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-surface-500">Theory Model:</span>
                    <div className="flex items-center rounded-lg border border-surface-300 bg-surface-100 p-0.5">
                        {theories.map((t) => (
                            <button
                                key={t.version}
                                type="button"
                                onClick={() => setActiveVersion(t.version)}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                    activeVersion === t.version
                                        ? "bg-insignia-500 text-surface-0 shadow"
                                        : "text-surface-400 hover:text-surface-200"
                                }`}
                            >
                                {t.version} {t.isSuperseded ? "(Superseded)" : "(Active)"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Theory Card */}
            <div className="rounded-xl border border-surface-300 bg-surface-100/90 p-5 shadow-sm space-y-5">
                {/* Non-Dismissible Hypothesis Label (Product Domain Non-Negotiable) */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200/80 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded bg-purple-950/80 border border-purple-500/50 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-purple-300 shadow-[0_0_8px_rgba(139,92,246,0.3)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                            <span>Investigative hypothesis — not a finding</span>
                        </span>
                        {currentTheory.supersedesVersion && (
                            <span className="text-[11px] font-mono text-surface-500">
                                (supersedes {currentTheory.supersedesVersion} upon recovering laptop ledgers)
                            </span>
                        )}
                    </div>

                    <ConfidenceBadge score={currentTheory.overallConfidenceScore} size="md" />
                </div>

                {/* Theory Title & Rationale */}
                <div>
                    <h4 className="text-lg font-bold text-surface-900 leading-snug">
                        {currentTheory.title}
                    </h4>
                    <p className="mt-2 text-xs text-surface-600 leading-relaxed bg-surface-0/60 p-3 rounded-lg border border-surface-200 font-mono text-[11px]">
                        <strong className="text-surface-400">Synthesis Basis:</strong> {currentTheory.rationale}
                    </p>
                </div>

                {/* Chronological Sub-Event Sequence */}
                <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-3 flex items-center gap-2">
                        <Icon name="clock" size={13} className="text-insignia-400" />
                        <span>Reconstructed Sub-Event Sequence</span>
                    </h5>

                    <div className="relative border-l-2 border-surface-300 ml-3 pl-6 space-y-4">
                        {currentTheory.sequence.map((step) => (
                            <div key={step.stepNumber} className="relative">
                                {/* Step Dot */}
                                <div className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-0 border-2 border-insignia-500 text-[10px] font-mono font-bold text-insignia-400 shadow-sm">
                                    {step.stepNumber}
                                </div>

                                <div className="rounded-lg border border-surface-300 bg-surface-0/80 p-3 text-xs">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-surface-800 leading-relaxed font-medium">
                                            {step.description}
                                        </p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <ConfidenceBadge score={step.confidence} size="sm" />
                                            <SourceCitationPopover source={step.citation} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Explicit Unresolved Gaps Sub-List linked to Lead Board */}
                <div className="border-t border-surface-200/80 pt-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2.5 flex items-center gap-2">
                        <Icon name="alert-triangle" size={14} className="text-purple-400" />
                        <span>Unresolved Gaps In Current Theory (Cross-Linked to Lead Board)</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {currentTheory.unresolvedGaps.map((gap, i) => (
                            <div
                                key={i}
                                className="rounded-lg border border-purple-500/40 border-dashed bg-purple-950/20 p-3 text-xs flex flex-col justify-between gap-2"
                            >
                                <span className="text-surface-700 font-semibold leading-tight">
                                    {gap.gapTitle}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => onJumpToLead && onJumpToLead(gap.linkedLeadId)}
                                    className="inline-flex items-center justify-between text-[10px] font-mono text-purple-300 hover:text-white bg-purple-900/60 hover:bg-purple-800 px-2 py-1 rounded transition-colors cursor-pointer mt-1"
                                >
                                    <span>Inspect Lead</span>
                                    <Icon name="arrow-right" size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
