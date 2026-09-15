// src/services/analytics.ts
import { apiRequest } from "./api";
import { USE_MOCK_API } from "../config";
import {
    mockFactSheet,
    mockTheories,
    mockMOMatches,
    mockIdentityResolution,
    mockPhantomLeads,
    type CrimeTheory,
    type FactSheetData,
    type PhantomLead,
    type MOMatch,
} from "../data/mockCaseData";

export interface PriorityLeadItem {
    entity_id: string;
    display_name: string;
    score: number;
    components: {
        gnn_probability: number;
        centrality: number;
        mo_similarity: number;
        direct_evidence: number;
        recidivism: number;
    };
}

export interface AnalysisReport {
    case_id: string;
    total_entities: number;
    total_documents_analyzed: number;
    cross_case_connections: number;
    priority_leads: PriorityLeadItem[];
    theories: CrimeTheory[];
    fact_sheet: FactSheetData | null;
    gnn_predictions: any[];
    mo_matches: {
        matched_historical_cases?: MOMatch[];
    } | any;
    entities?: Array<{
        id: string;
        name: string;
        source: string;
        matchingAttributes: string[];
    }>;
    analyzed_at: string;
}

export interface GraphNode {
    id: string;
    label: string;
    type: string;
    badge?: string;
    risk_score?: number;
    merge_reason?: string;
    is_phantom?: boolean;
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    label: string;
    color?: string;
    style?: string;
    is_hypothesis?: boolean;
    probability?: number;
    valid_from?: string;
    merge_reason?: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export interface EntitySummary {
    entity_id: string;
    entity_type: string;
    display_name: string;
    source_documents: string[];
    connections_count: number;
}

export interface CaseEntitiesResponse {
    case_id: string;
    case_name: string;
    total_entities: number;
    entities: EntitySummary[];
}

export interface CrossCaseConnection {
    entity_id: string;
    display_name: string;
    entity_type: string;
    appearing_in_cases: string[];
    total_appearances: number;
}

export interface CrossCaseResponse {
    total_cross_case_entities: number;
    connections: CrossCaseConnection[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeCrimeTheory(t: any, idx = 0): CrimeTheory {
    const score = t.overallConfidenceScore ?? t.confidence_score ?? t.confidenceScore ?? 0.85;
    const qualifier =
        t.overallConfidenceQualifier ||
        (score >= 0.85 ? "strong evidence" : score >= 0.65 ? "possible lead" : "unconfirmed hypothesis");

    const seq = Array.isArray(t.sequence) && t.sequence.length > 0
        ? t.sequence
        : Array.isArray(t.chronology) && t.chronology.length > 0
        ? t.chronology.map((c: any, i: number) => ({
              stepNumber: c.step || i + 1,
              description: c.action || c.description || "",
              confidence: c.confidence || 0.9,
              citation: {
                  documentTitle: c.supporting_evidence?.[0] || "Case Evidence File",
                  pageOrOffset: c.timestamp_window || "Timeline Analysis",
                  confidenceScore: 0.9,
                  rawSnippet: c.action || "",
              },
          }))
        : [
              {
                  stepNumber: 1,
                  description: t.summary || t.title || "Primary suspect identified via multi-modal evidence link.",
                  confidence: score,
                  citation: {
                      documentTitle: "FIR Ingestion Dossier",
                      pageOrOffset: "Exhibit #1",
                      confidenceScore: score,
                      rawSnippet: t.title || "",
                  },
              },
          ];

    const gaps = Array.isArray(t.unresolvedGaps) && t.unresolvedGaps.length > 0
        ? t.unresolvedGaps
        : Array.isArray(t.unresolved_gaps) && t.unresolved_gaps.length > 0
        ? t.unresolved_gaps.map((g: any) => ({
              gapTitle: g.description || g.gapTitle || "Unidentified Associate",
              linkedLeadId: g.recommended_action || g.linkedLeadId || "LEAD-01",
          }))
        : [
              {
                  gapTitle: "Verify telecommunication tower logs with bank withdrawal timestamps.",
                  linkedLeadId: "LEAD-01",
              },
          ];

    return {
        version: t.version || t.theory_id || `v${idx + 1}`,
        isSuperseded: t.isSuperseded || false,
        supersedesVersion: t.supersedesVersion,
        title: t.title || "Multi-Modal Crime Theory",
        overallConfidenceQualifier: qualifier,
        overallConfidenceScore: score,
        rationale: t.rationale || t.summary || t.motive_category || "Synthesized from cross-case GNN link prediction and MO analysis.",
        sequence: seq,
        unresolvedGaps: gaps,
    };
}

export function normalizeMOMatch(m: any, idx = 0): MOMatch {
    const sim = typeof m.overallSimilarity === "number"
        ? m.overallSimilarity
        : typeof m.similarity_score === "number"
        ? m.similarity_score
        : 0.84;
    return {
        id: m.id || m.case_id || `mo-${idx + 1}`,
        matchedCaseId: m.matchedCaseId || m.case_id || `FIR ${100 + idx}/2025`,
        title: m.title || m.summary || `Pattern Linkage: Case ${m.case_id || idx + 1}`,
        jurisdiction: m.jurisdiction || "Special Cell / Cyber Crime",
        dateReported: m.dateReported || "2025-11-20",
        overallSimilarity: sim,
        geospatialSimilarity: m.geospatialSimilarity ?? m.dimensionScores?.geospatial ?? 0.85,
        temporalSimilarity: m.temporalSimilarity ?? m.dimensionScores?.temporal ?? 0.78,
        textSimilarity: m.textSimilarity ?? m.dimensionScores?.modusOperandi ?? 0.88,
        commonFactors: Array.isArray(m.commonFactors)
            ? m.commonFactors
            : Array.isArray(m.common_factors)
            ? m.common_factors
            : ["Transit Bypass", "Burner Phone Relays"],
        status: (m.status === "Active Linkage" || m.status === "Under Review" || m.status === "Dismissed")
            ? m.status
            : sim >= 0.85
            ? "Active Linkage"
            : "Under Review",
    };
}

export function normalizeFactSheet(raw: any, caseId = "case-1", caseName = "Case Investigation"): FactSheetData {
    if (!raw) {
        return {
            caseId,
            firNumber: caseName,
            track: 2,
            triageReason: "Case evidence processing in progress or awaiting multi-stream ingestion.",
            who: [],
            what: [],
            when: [],
            where: [],
            evidence: [],
            knownRelationships: [],
            openGaps: [],
        };
    }

    const who = Array.isArray(raw.who)
        ? raw.who.map((w: any, idx: number) => ({
              id: w.id || `who-${idx + 1}`,
              name: w.name || "Unknown Suspect",
              role: (w.role || "Accused") as any,
              isPhantom: Boolean(w.isPhantom || w.is_phantom),
              alias: w.alias || w.details,
              citation: w.citation || {
                  documentTitle: "FIR Ingestion Record",
                  confidenceScore: 0.95,
                  rawSnippet: `${w.name} (${w.role || "Accused"})`,
              },
          }))
        : [];

    const what = Array.isArray(raw.what)
        ? raw.what.map((item: any) => ({
              bnsSection: item.bnsSection || item.section || "BNS §111",
              statuteName: item.statuteName || item.statute || "Organized Crime Syndicate",
              description: item.description || "",
              applicableTo: item.applicableTo || "",
              citation: item.citation || {
                  documentTitle: "Statutory Classification",
                  confidenceScore: 0.9,
              },
          }))
        : [];

    const when = Array.isArray(raw.when)
        ? raw.when.map((item: any) => ({
              timestamp: item.timestamp || new Date().toISOString(),
              event: item.event || "",
              location: item.location || "",
              citation: item.citation || {
                  documentTitle: "Temporal Timeline",
                  confidenceScore: 0.9,
              },
          }))
        : [];

    const where = Array.isArray(raw.where)
        ? raw.where.map((item: any) => ({
              locationName: item.locationName || item.location || "",
              jurisdiction: item.jurisdiction || "Special Operations",
              significance: item.significance || "Incident Location",
              coordinates: (Array.isArray(item.coordinates) && item.coordinates.length === 2 ? item.coordinates : [28.6139, 77.2090]) as [number, number],
              citation: item.citation || {
                  documentTitle: "Geospatial Analysis",
                  confidenceScore: 0.9,
              },
          }))
        : [];

    const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];
    const knownRelationships = Array.isArray(raw.knownRelationships)
        ? raw.knownRelationships
        : Array.isArray(raw.relationships)
        ? raw.relationships
        : [];
    const openGaps = Array.isArray(raw.openGaps)
        ? raw.openGaps
        : Array.isArray(raw.gaps)
        ? raw.gaps
        : [];

    return {
        caseId,
        firNumber: raw.fir_number || raw.case_summary || caseName,
        track: (raw.track as 1 | 2) || 2,
        triageReason: raw.preliminary_working_hypothesis || raw.triage_reason || "Multi-channel evidence processed.",
        diffSummary: raw.diffSummary,
        who,
        what,
        when,
        where,
        evidence,
        knownRelationships,
        openGaps,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// API Methods
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trigger full AI Historical Analysis:
 * Entity resolution -> GNN Link Prediction -> MO Matching -> Theory Generation -> Judicial Summarizer
 */
export async function triggerHistoricalAnalysis(
    caseId: string
): Promise<AnalysisReport> {
    if (USE_MOCK_API) {
        return {
            case_id: caseId,
            total_entities: 0,
            total_documents_analyzed: 0,
            cross_case_connections: 0,
            priority_leads: [],
            theories: [],
            fact_sheet: null,
            gnn_predictions: [],
            mo_matches: { matched_historical_cases: [] },
            entities: [],
            analyzed_at: new Date().toISOString(),
        };
    }

    const raw = await apiRequest<any>(`/api/cases/${caseId}/analyze-historical`, {
        method: "POST",
    });

    const rawTheories = Array.isArray(raw.theories) ? raw.theories : [];
    const theories = rawTheories.map((t: any, i: number) => normalizeCrimeTheory(t, i));

    const rawMOMatches = raw.mo_matches?.matched_historical_cases || (Array.isArray(raw.mo_matches) ? raw.mo_matches : []);
    const matchedCases = Array.isArray(rawMOMatches)
        ? rawMOMatches.map((m: any, i: number) => normalizeMOMatch(m, i))
        : [];

    const factSheet = raw.fact_sheet
        ? normalizeFactSheet(raw.fact_sheet, caseId, raw.case_name)
        : null;

    return {
        case_id: raw.case_id || caseId,
        total_entities: raw.total_entities ?? 0,
        total_documents_analyzed: raw.total_documents_analyzed ?? 0,
        cross_case_connections: raw.cross_case_connections ?? 0,
        priority_leads: Array.isArray(raw.priority_leads) ? raw.priority_leads : [],
        theories,
        fact_sheet: factSheet,
        gnn_predictions: raw.gnn_predictions || [],
        mo_matches: { matched_historical_cases: matchedCases },
        entities: Array.isArray(raw.entities) ? raw.entities : [],
        analyzed_at: raw.analyzed_at || new Date().toISOString(),
    };
}

/**
 * Fetch Cytoscape/Force-Directed Heterogeneous Knowledge Graph for the case
 */
export async function getCaseGraph(caseId: string): Promise<GraphData> {
    if (USE_MOCK_API) {
        return { nodes: [], edges: [] };
    }

    try {
        const raw: any = await apiRequest<any>(`/api/cases/${caseId}/graph`);

        if (raw?.elements?.nodes) {
            return {
                nodes: raw.elements.nodes.map((n: any) => ({
                    id: n.data?.id || n.id,
                    label: n.data?.label || n.label || n.id,
                    type: n.data?.type || n.type || "entity",
                    badge: n.data?.badge || n.badge,
                    risk_score: n.data?.risk_score ?? n.risk_score,
                    merge_reason: n.data?.merge_reason || n.merge_reason,
                    is_phantom: n.data?.is_phantom || n.is_phantom,
                })),
                edges: raw.elements.edges.map((e: any) => ({
                    id: e.data?.id || e.id,
                    source: e.data?.source || e.source,
                    target: e.data?.target || e.target,
                    label: e.data?.label || e.label || "connected_to",
                    color: e.data?.color || e.color,
                    style: e.data?.style || e.style,
                    is_hypothesis: e.data?.is_hypothesis ?? e.is_hypothesis,
                    probability: e.data?.probability ?? e.probability,
                    valid_from: e.data?.valid_from || e.valid_from,
                })),
            };
        }

        if (raw?.nodes && raw?.edges) {
            return raw;
        }

        return { nodes: [], edges: [] };
    } catch {
        return { nodes: [], edges: [] };
    }
}

/**
 * Fetch saved Crime Reconstruction Theories for the case
 */
export async function getCaseTheories(caseId: string): Promise<CrimeTheory[]> {
    if (USE_MOCK_API) {
        return [];
    }

    const raw: any = await apiRequest<any>(`/api/cases/${caseId}/theories`);
    const list = Array.isArray(raw) ? raw : (raw?.theories || []);
    return list.map((t: any, i: number) => normalizeCrimeTheory(t, i));
}

/**
 * Fetch catalog of resolved entities and suspects extracted from case documents
 */
export async function getCaseEntities(
    caseId: string
): Promise<CaseEntitiesResponse> {
    if (USE_MOCK_API) {
        return {
            case_id: caseId,
            case_name: "Case Investigation",
            total_entities: 0,
            entities: [],
        };
    }

    return await apiRequest<CaseEntitiesResponse>(`/api/cases/${caseId}/entities`);
}

/**
 * Fetch syndicates and entities that appear across multiple cases
 */
export async function getCrossCaseConnections(): Promise<CrossCaseResponse> {
    if (USE_MOCK_API) {
        return {
            total_cross_case_entities: 0,
            connections: [],
        };
    }

    return await apiRequest<CrossCaseResponse>("/api/analysis/cross-case-connections");
}
