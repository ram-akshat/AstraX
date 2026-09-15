// src/components/dashboard/analytics/TimelineView.tsx
import { useState } from "react";
import { mockTimeline } from "../../../data/mockCaseData";
import ConfidenceBadge from "../../ui/ConfidenceBadge";
import SourceCitationPopover from "../../ui/SourceCitationPopover";
import Icon from "../../ui/Icon";

import { USE_MOCK_API } from "../../../config";

interface TimelineViewProps {
    onSelect?: (item: any) => void;
    events?: typeof mockTimeline;
}

export default function TimelineView({ onSelect, events }: TimelineViewProps) {
    const [filter, setFilter] = useState("all");
    const activeEvents = events !== undefined ? events : (USE_MOCK_API ? mockTimeline : []);

    const filtered = filter === "all" 
        ? activeEvents 
        : activeEvents.filter(t => t.type === filter);

    const sorted = [...filtered].sort(
        (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    );

    return (
        <div className="flex flex-col bg-surface-0 rounded-xl border border-surface-300 p-5 font-sans">
            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-surface-300">
                <div>
                    <h3 className="text-base font-bold text-surface-900 tracking-tight flex items-center gap-2">
                        <Icon name="clock" size={16} className="text-insignia-400" />
                        <span>Chronological Crime Timeline</span>
                    </h3>
                    <p className="text-xs text-surface-500 mt-0.5">
                        Verified sequence of physical and digital incidents cross-referenced with forensic timestamps.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-surface-400">Filter Modality:</span>
                    <select 
                        className="bg-surface-100 border border-surface-300 text-xs rounded-lg px-2.5 py-1 text-surface-800 font-mono outline-none focus:border-insignia-500"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Channels</option>
                        <option value="incident">Police Incident / Recovery</option>
                        <option value="financial">Financial Transfers</option>
                        <option value="communication">Encrypted Comms</option>
                        <option value="movement">Physical Movement</option>
                    </select>
                </div>
            </div>

            {/* Vertical Timeline Stack */}
            <div className="relative border-l-2 border-surface-300 ml-4 pl-8 space-y-6">
                {sorted.map((event) => (
                    <div key={event.id} className="relative group">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-[41px] top-2 flex h-5 w-5 items-center justify-center rounded-full bg-surface-0 border-4 border-insignia-500 shadow-[0_0_8px_rgba(201,162,39,0.4)] z-10" />

                        {/* Event Card */}
                        <div 
                            className="bg-surface-100 rounded-xl border border-surface-300 p-4 transition-all hover:border-insignia-500/50 hover:bg-surface-100/95 cursor-pointer shadow-sm flex flex-col gap-2.5"
                            onClick={() => onSelect && onSelect({
                                id: event.id,
                                label: event.description,
                                type: event.type,
                                confidence: event.confidence,
                                details: {
                                    date: event.date,
                                    time: event.time,
                                    entity: event.entity,
                                    location: event.location,
                                    ...(event as any).details
                                },
                                citation: (event as any).citation,
                                merge_reason: `Timeline event logged at ${event.date} ${event.time} under ${event.type}`
                            })}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-insignia-400 bg-insignia-500/15 border border-insignia-500/30 px-2 py-0.5 rounded">
                                        {event.type}
                                    </span>
                                    <span className="text-sm font-bold text-surface-900">
                                        {event.entity}
                                    </span>
                                </div>
                                
                                <div className="font-mono text-xs text-right">
                                    <span className="font-bold text-surface-700">{event.date}</span>
                                    <span className="text-insignia-400 ml-1.5 font-bold">[{event.time} IST]</span>
                                </div>
                            </div>

                            <p className="text-surface-600 text-xs leading-relaxed font-sans">
                                {event.description}
                            </p>

                            <div className="flex items-center justify-between border-t border-surface-200/80 pt-2 text-xs">
                                <div className="flex items-center gap-4 text-surface-500 font-mono text-[11px]">
                                    <span className="flex items-center gap-1">
                                        <Icon name="map-pin" size={12} className="text-surface-400" />
                                        {event.location}
                                    </span>
                                    <ConfidenceBadge score={event.confidence} size="sm" />
                                </div>

                                {(event as any).citation && (
                                    <SourceCitationPopover source={(event as any).citation} />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
