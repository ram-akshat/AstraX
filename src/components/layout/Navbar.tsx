// src/components/layout/Navbar.tsx
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Icon from "../ui/Icon";

export default function Navbar() {
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path: string) => {
        if (path === "/" && location.pathname === "/") return true;
        if (path !== "/" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const timeStr = currentTime.toLocaleTimeString("en-IN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const dateStr = currentTime.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    return (
        <header className="flex h-13 shrink-0 items-center justify-between border-b border-surface-300/60 bg-surface-50/95 px-4 z-30 font-sans backdrop-blur-md">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-5">
                <Link to="/" className="flex items-center gap-2.5 group">
                    <img src="/astrax-logo.png" alt="AstraX Logo" className="h-7 w-7 rounded-md object-contain group-hover:scale-105 transition-transform" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                    <div className="flex flex-col">
                        <span className="text-sm font-extrabold tracking-tight text-surface-900 leading-none flex items-center gap-1.5">
                            <span>ASTRA</span>
                            <span className="text-insignia-400">X</span>
                        </span>
                        <span className="text-[8px] font-mono tracking-[0.2em] text-surface-400 uppercase">
                            Intelligence Platform
                        </span>
                    </div>
                </Link>

                {/* Vertical Separator */}
                <div className="h-5 w-px bg-surface-300/50" />

                {/* Primary Nav */}
                <nav className="hidden sm:flex items-center gap-1 font-mono text-[11px]">
                    <Link
                        to="/intake"
                        className={`px-2.5 py-1 rounded transition-colors ${
                            isActive("/intake")
                                ? "bg-insignia-500/12 text-insignia-400 font-bold border border-insignia-500/20"
                                : "text-surface-400 hover:text-surface-200 hover:bg-surface-200/40"
                        }`}
                    >
                        Evidence Intake
                    </Link>
                    <Link
                        to="/dashboard"
                        className={`px-2.5 py-1 rounded transition-colors ${
                            isActive("/dashboard") || isActive("/cases")
                                ? "bg-insignia-500/12 text-insignia-400 font-bold border border-insignia-500/20"
                                : "text-surface-400 hover:text-surface-200 hover:bg-surface-200/40"
                        }`}
                    >
                        Case Directory
                    </Link>
                </nav>
            </div>

            {/* Right: Status + Actions */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
                {/* System Status Strip */}
                <div className="hidden lg:flex items-center gap-3 text-surface-400 mr-2">
                    <div className="flex items-center gap-1.5">
                        <span className="status-dot-online" />
                        <span>AIR-GAPPED CORE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="status-dot-online" />
                        <span>AI ENGINE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="status-dot-online" />
                        <span>GRAPH</span>
                    </div>
                </div>

                <div className="h-5 w-px bg-surface-300/40 hidden lg:block" />

                {/* Clock */}
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-surface-600 font-bold tabular-nums">{timeStr}</span>
                    <span className="text-[8px] text-surface-500 uppercase">{dateStr}</span>
                </div>

                <div className="h-5 w-px bg-surface-300/40 hidden md:block" />

                {/* New Intake CTA */}
                <Link
                    to="/intake"
                    className="inline-flex items-center gap-1.5 rounded-md bg-insignia-500 hover:bg-insignia-400 text-surface-0 font-bold px-3 py-1.5 text-[11px] transition-colors shadow cursor-pointer"
                >
                    <Icon name="plus" size={11} />
                    <span>New Intake</span>
                </Link>
            </div>
        </header>
    );
}
