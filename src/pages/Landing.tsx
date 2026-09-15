// src/pages/Landing.tsx
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import dashboardImage from "../assets/dashboard.png";
import graphImage from "../assets/graph.png";
import Icon from "../components/ui/Icon";

const HeroScene = lazy(() => import("../components/landing/HeroScene.tsx"));

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
    }),
};

const features = [
    {
        icon: "upload" as const,
        title: "Multi-Source Evidence Intake",
        desc: "Ingest and parse FIR text, scanned seizure memos, CCTV footage, wiretap audio, and bank CDR ledgers across isolated domain pipelines.",
    },
    {
        icon: "fingerprint" as const,
        title: "Entity Correlation & Disambiguation",
        desc: "Automatically correlate identifiers across fragmented systems to disambiguate targets, identify alias networks, and isolate shell entities.",
    },
    {
        icon: "network-graph" as const,
        title: "GNN Link Analysis & Reconstruction",
        desc: "Deploy Graph Neural Networks to uncover hidden criminal hierarchies, detect fund layering, and synthesize testable investigation theories.",
    },
];

const workflowSteps = [
    { num: "01", label: "CASE", desc: "Define the investigation" },
    { num: "02", label: "EVIDENCE", desc: "Ingest multi-modal data" },
    { num: "03", label: "CONNECTION", desc: "Discover relationships" },
    { num: "04", label: "AI ANALYSIS", desc: "Detect suspicious patterns" },
    { num: "05", label: "INSIGHT", desc: "Understand why" },
    { num: "06", label: "ACTION", desc: "Investigate further" },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-surface-0 font-sans text-surface-700 selection:bg-insignia-500/30 selection:text-white">
            {/* ── Nav ─── */}
            <nav className="relative z-20 mx-auto flex h-16 max-w-7xl items-center justify-between px-6 border-b border-surface-200/30">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-insignia-500/12 border border-insignia-500/30 text-insignia-400">
                        <Icon name="shield" size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-extrabold tracking-tight text-surface-900 leading-none flex items-center gap-1">
                            <span>ASTRA</span>
                            <span className="text-insignia-400">X</span>
                        </span>
                        <span className="text-[8px] font-mono tracking-[0.2em] text-surface-500 uppercase">
                            Tactical Intelligence Platform
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to="/dashboard"
                        className="rounded-md border border-surface-300/50 bg-surface-100/60 px-3.5 py-1.5 text-[11px] font-semibold text-surface-400 hover:text-surface-200 hover:bg-surface-200/40 transition-colors"
                    >
                        Case Directory
                    </Link>
                    <Link
                        to="/intake"
                        className="rounded-md bg-insignia-500/90 hover:bg-insignia-400 text-surface-0 px-3.5 py-1.5 text-[11px] font-bold transition-colors"
                    >
                        Run Pipeline
                    </Link>
                </div>
            </nav>

            {/* ── Hero ─── */}
            <section className="relative overflow-hidden pt-16 pb-24 lg:pt-20 lg:pb-28 bg-radial from-surface-50/80 to-surface-0">
                {/* 3D Background */}
                <div className="absolute inset-0 z-0 opacity-60">
                    <Suspense fallback={null}>
                        <HeroScene />
                    </Suspense>
                </div>

                <div className="absolute inset-0 bg-tactical-fine opacity-100 pointer-events-none" />

                <div className="relative z-10 mx-auto max-w-7xl px-6 lg:flex lg:items-center lg:gap-12">
                    <div className="max-w-2xl lg:w-1/2">
                        {/* Domain Tag */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={0}
                            className="inline-flex items-center gap-2 rounded-md border border-insignia-500/20 bg-insignia-500/8 px-2.5 py-1 text-[10px] font-mono font-bold text-insignia-400 mb-5"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-insignia-400 animate-pulse" />
                            <span>Criminal Network & Syndicate Analysis</span>
                        </motion.div>

                        <motion.h1
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={1}
                            className="text-3xl font-black leading-[1.15] tracking-tight text-surface-900 sm:text-4xl lg:text-5xl"
                        >
                            Intelligence for the{" "}
                            <span className="text-insignia-400">Investigation.</span>
                        </motion.h1>

                        <motion.p
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={2}
                            className="mt-5 text-sm leading-relaxed text-surface-600 sm:text-base max-w-lg"
                        >
                            Evidence → Connections → Intelligence. Purpose-built for state police cyber cells to reconstruct syndicate operations with AI-powered graph analysis and strict evidentiary chain-of-custody.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={3}
                            className="mt-7 flex flex-wrap items-center gap-3"
                        >
                            <Link
                                to="/intake"
                                className="flex items-center gap-2 rounded-md bg-insignia-500/90 px-6 py-3 text-sm font-bold text-surface-0 transition-all hover:bg-insignia-400 cursor-pointer"
                            >
                                <Icon name="radar" size={15} />
                                <span>Run New Analysis</span>
                            </Link>

                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2 rounded-md border border-surface-300/50 bg-surface-100/60 px-6 py-3 text-sm font-bold text-surface-300 transition-all hover:bg-surface-200/40 hover:border-surface-400/50 cursor-pointer"
                            >
                                <Icon name="folder" size={15} />
                                <span>View Case History</span>
                            </Link>
                        </motion.div>

                        {/* Trust Strip */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeUp}
                            custom={4}
                            className="mt-7 pt-5 border-t border-surface-200/30 flex items-center gap-2 text-[10px] font-mono text-surface-500"
                        >
                            <Icon name="shield" size={12} className="text-insignia-400 shrink-0" />
                            <span>BSA 2023-aligned • DPDP-compliant • On-prem deployable</span>
                        </motion.div>
                    </div>

                    {/* Right Hero */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
                        className="mt-14 lg:mt-0 lg:w-1/2"
                    >
                        <div className="relative rounded-lg bg-surface-100 border border-surface-300/50 p-1.5 shadow-2xl shadow-black/20">
                            <img
                                src={dashboardImage}
                                alt="AstraX Tactical Dashboard"
                                className="w-full rounded-md object-cover border border-surface-300/50"
                            />

                            {/* Callout */}
                            <div className="absolute -left-5 top-1/3 hidden rounded-md border border-insignia-500/25 bg-surface-100/95 backdrop-blur-sm p-3 shadow-xl sm:block w-48 font-mono">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-insignia-400 animate-pulse-subtle" />
                                    <span className="text-[9px] font-bold text-insignia-400 uppercase">
                                        Active Linkage
                                    </span>
                                </div>
                                <div className="text-[11px] font-bold text-surface-900">Apex Logistics LLC</div>
                                <div className="text-[9px] text-surface-500 mt-0.5">Hidden Owner: 92% Match</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Investigation Workflow ─── */}
            <section className="border-y border-surface-200/30 bg-surface-50/50 py-10 overflow-hidden">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center mb-8">
                        <h3 className="text-[10px] font-mono font-bold text-insignia-400 uppercase tracking-[0.2em] mb-2">
                            Investigation Workflow
                        </h3>
                        <p className="text-xs text-surface-500 max-w-md mx-auto">
                            From case initiation to actionable intelligence in a unified platform.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {workflowSteps.map((step, i) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08, duration: 0.4 }}
                                className="rounded-md border border-surface-300/40 bg-surface-100/60 p-3 text-center"
                            >
                                <div className="text-[10px] font-mono text-insignia-400 font-bold mb-1">{step.num}</div>
                                <div className="text-xs font-bold text-surface-900 uppercase tracking-wide">{step.label}</div>
                                <div className="text-[9px] text-surface-500 mt-0.5">{step.desc}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Problem Section ─── */}
            <section className="py-20 bg-surface-0">
                <div className="mx-auto max-w-7xl px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                        className="mb-14 max-w-2xl"
                    >
                        <div className="text-[10px] font-mono font-bold text-insignia-400 uppercase tracking-[0.15em] mb-2">
                            The Fragmentation Bottleneck
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-surface-900 sm:text-3xl">
                            Modern Syndicates Operate in Data Silos
                        </h2>
                        <p className="mt-5 text-sm leading-relaxed text-surface-600">
                            Organized criminal networks split communications across disposable VoIP carriers, route payments below statutory reporting thresholds, and hide beneficial ownership behind layered corporate fronts.
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-surface-600">
                            AstraX bridges this gap by unifying isolated evidence channels into an active, evidence-backed knowledge graph with AI-powered link prediction.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Features ─── */}
            <section className="py-20 bg-surface-50/50 border-t border-surface-200/30">
                <div className="mx-auto max-w-7xl px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                        className="mb-12 text-center max-w-2xl mx-auto"
                    >
                        <h2 className="text-2xl font-extrabold tracking-tight text-surface-900 sm:text-3xl">
                            Unified Tactical Intelligence
                        </h2>
                        <p className="mt-3 text-sm text-surface-600">
                            Engineered for high information density, strict evidentiary provenance, and accelerated prosecutorial briefs.
                        </p>
                    </motion.div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                variants={fadeUp}
                                custom={i}
                                className="rounded-lg bg-surface-100 border border-surface-300/50 p-6 transition-all hover:border-insignia-500/25"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-insignia-500/10 border border-insignia-500/20 text-insignia-400">
                                    <Icon name={f.icon} size={18} />
                                </div>
                                <h3 className="text-sm font-bold text-surface-900">{f.title}</h3>
                                <p className="mt-2 text-xs leading-relaxed text-surface-600">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Visual Insight Section ─── */}
            <section className="py-20 bg-surface-0 border-t border-surface-200/30">
                <div className="mx-auto max-w-7xl px-6 lg:flex lg:items-center lg:gap-14">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="lg:w-1/2"
                    >
                        <div className="overflow-hidden rounded-lg border border-surface-300/50 shadow-xl bg-surface-100 p-1.5">
                            <img
                                src={graphImage}
                                alt="Network Graph Visualization"
                                className="w-full rounded-md object-cover border border-surface-300/50"
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={0}
                        className="mt-10 lg:mt-0 lg:w-1/2"
                    >
                        <h2 className="text-2xl font-extrabold tracking-tight text-surface-900 sm:text-3xl">
                            Leads Not Verdicts
                        </h2>
                        <p className="mt-5 text-sm leading-relaxed text-surface-600">
                            Every AI-derived prediction is accompanied by plain-language qualifiers and interactive source citations. Hypotheses remain clearly distinguished from confirmed forensic evidence.
                        </p>

                        <div className="mt-6 space-y-3 font-mono text-[10px]">
                            <div className="flex items-start gap-2.5 rounded-md border border-surface-300/50 bg-surface-100/60 p-2.5">
                                <span className="status-dot-online mt-0.5" />
                                <div>
                                    <strong className="text-surface-900 block text-[11px]">Confirmed Evidence</strong>
                                    <span className="text-surface-500">KYC mandates, NAFIS prints, and banking UTR records.</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 rounded-md border border-violet-500/25 border-dashed bg-violet-950/10 p-2.5">
                                <span className="status-dot-hypothesis mt-0.5" />
                                <div>
                                    <strong className="text-violet-300 block text-[11px]">GNN Hypothesis</strong>
                                    <span className="text-surface-500">Unconfirmed links tagged with confidence intervals for human inquiry.</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Footer ─── */}
            <footer className="border-t border-surface-200/30 bg-surface-50/30 py-8 text-surface-500 text-[10px]">
                <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2.5">
                        <img src="/astrax-logo.png" alt="AstraX Logo" className="h-6 w-6 rounded object-contain" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                        <span className="font-extrabold text-surface-900 text-xs tracking-tight">ASTRA<span className="text-insignia-400">X</span></span>
                        <span className="font-mono text-[9px] text-surface-500">│ Tactical Intelligence Platform</span>
                    </div>

                    <p className="font-mono text-[9px]">
                        Designed for State Police Cyber Crime Cells • Air-Gapped / On-Prem Architecture
                    </p>
                </div>
            </footer>
        </div>
    );
}
