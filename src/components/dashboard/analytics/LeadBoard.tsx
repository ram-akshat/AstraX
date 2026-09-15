// src/components/dashboard/analytics/LeadBoard.tsx
import { useState, useEffect } from "react";
import Icon from "../../ui/Icon";
import ConfidenceBadge from "../../ui/ConfidenceBadge";
import { mockPhantomLeads, type PhantomLead } from "../../../data/mockCaseData";

const COLUMNS: Array<{ id: PhantomLead["status"]; label: string; dotColor: string }> = [
    { id: "open", label: "Open Investigative Leads", dotColor: "bg-purple-400" },
    { id: "requested", label: "Formal Data Requested", dotColor: "bg-amber-400" },
    { id: "resolved", label: "Resolved / Merged", dotColor: "bg-emerald-400" },
    { id: "dismissed", label: "Dismissed / Inactive", dotColor: "bg-surface-400" },
];

interface LeadBoardProps {
    onSelectLead?: (lead: PhantomLead) => void;
    data?: PhantomLead[];
}

import { USE_MOCK_API } from "../../../config";

export default function LeadBoard({ onSelectLead, data }: LeadBoardProps) {
    const [leads, setLeads] = useState<PhantomLead[]>(data !== undefined ? data : (USE_MOCK_API ? mockPhantomLeads : []));

    useEffect(() => {
        if (data !== undefined) {
            setLeads(data);
        }
    }, [data]);

    const advanceStatus = (leadId: string, nextStatus: PhantomLead["status"]) => {
        setLeads((prev) =>
            prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-300 pb-3">
                <div>
                    <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-950/80 border border-purple-500/50 text-purple-300 text-xs font-mono font-bold">
                            ?
                        </span>
                        <span>Investigative Lead Board — Phantom Entity Lifecycle</span>
                    </h3>
                    <p className="text-xs text-surface-500 mt-0.5">
                        Tracks unconfirmed node slots, partial identifier attributes, and operational subpoena requests.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-md">
                    <span>{leads.filter((l) => l.status === "open").length} Open Unresolved Leads</span>
                </div>
            </div>

            {/* Kanban Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COLUMNS.map((col) => {
                    const columnLeads = leads.filter((l) => l.status === col.id);

                    return (
                        <div
                            key={col.id}
                            className="flex flex-col rounded-xl border border-surface-300 bg-surface-100/60 p-3 min-h-[320px]"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between border-b border-surface-200/80 pb-2.5 mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                                    <span className="text-xs font-bold uppercase tracking-wider text-surface-800">
                                        {col.label}
                                    </span>
                                </div>
                                <span className="font-mono text-xs text-surface-500 bg-surface-200 px-1.5 py-0.5 rounded">
                                    {columnLeads.length}
                                </span>
                            </div>

                            {/* Card Stack */}
                            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                                {columnLeads.length === 0 ? (
                                    <div className="h-32 flex items-center justify-center text-center text-xs text-surface-400 italic">
                                        No leads in this stage
                                    </div>
                                ) : (
                                    columnLeads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            onClick={() => onSelectLead && onSelectLead(lead)}
                                            className="group cursor-pointer rounded-lg border border-purple-500/40 border-dashed bg-surface-0/80 p-3.5 shadow-sm transition-all hover:border-purple-400 hover:bg-surface-0 hover:shadow-md flex flex-col gap-2.5"
                                        >
                                            {/* Top Tag & Confidence */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-950/70 border border-purple-500/40 text-purple-300 font-bold font-mono text-xs">
                                                        ?
                                                    </div>
                                                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded">
                                                        {lead.phantomType}
                                                    </span>
                                                </div>
                                                <ConfidenceBadge score={lead.confidenceScore} size="sm" />
                                            </div>

                                            {/* Lead Title */}
                                            <h4 className="text-xs font-bold text-surface-900 group-hover:text-purple-300 transition-colors">
                                                {lead.title}
                                            </h4>

                                            {/* Partial Attributes Key-Value Box */}
                                            <div className="rounded bg-surface-100 p-2 font-mono text-[11px] text-surface-600 space-y-1 border border-surface-200">
                                                {Object.entries(lead.partialAttributes).map(([k, v]) => (
                                                    <div key={k} className="flex justify-between gap-2 text-[10px]">
                                                        <span className="text-surface-400 capitalize">{k}:</span>
                                                        <span className="text-surface-800 truncate font-semibold">{v}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Recommended Action */}
                                            <div className="text-[11px] text-surface-500 leading-tight">
                                                <strong className="text-surface-400">Action:</strong> {lead.recommendedAction}
                                            </div>

                                            {/* Status Controls (One-Tap Lifecycle Advancement) */}
                                            <div className="border-t border-surface-200/80 pt-2 flex items-center justify-between text-[10px] font-mono">
                                                <span className="text-surface-400">Advance State:</span>
                                                <div className="flex items-center gap-1">
                                                    {lead.status === "open" && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                advanceStatus(lead.id, "requested");
                                                            }}
                                                            className="rounded bg-amber-950/70 text-amber-300 hover:bg-amber-900 px-2 py-0.5 border border-amber-500/30 transition-colors"
                                                        >
                                                            Request Data →
                                                        </button>
                                                    )}
                                                    {lead.status === "requested" && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                advanceStatus(lead.id, "resolved");
                                                            }}
                                                            className="rounded bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900 px-2 py-0.5 border border-emerald-500/30 transition-colors"
                                                        >
                                                            Resolve ✓
                                                        </button>
                                                    )}
                                                    {lead.status !== "dismissed" && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                advanceStatus(lead.id, "dismissed");
                                                            }}
                                                            className="rounded bg-surface-200 text-surface-400 hover:text-red-400 px-1.5 py-0.5 transition-colors"
                                                            title="Dismiss Lead"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                    {lead.status === "dismissed" && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                advanceStatus(lead.id, "open");
                                                            }}
                                                            className="rounded bg-surface-200 text-surface-300 hover:bg-surface-300 px-2 py-0.5 transition-colors"
                                                        >
                                                            Reopen
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
