// src/utils/factSheetSynthesizer.ts
import type { Document } from "../services/documents";
import type { FactSheetData } from "../data/mockCaseData";

export const SAMPLE_FIR_TEXT = `FIRST INFORMATION REPORT
(Under Section 173 Bharatiya Nagarik Suraksha Sanhita, 2023)
1. District: North Delhi       Police Station: Kashmere Gate       Year: 2026
   FIR No: 108/2026            Date & Time: 12-03-2026 15:30 HRS

2. Acts & Statutory Sections:
   (i) Bharatiya Nyaya Sanhita, 2023 (BNS) - Section 111 (Organized Crime Syndicate)
   (ii) Bharatiya Nyaya Sanhita, 2023 (BNS) - Section 316(2) (Criminal Breach of Trust)
   (iii) Information Technology Act, 2000 - Section 66D (Cheating by Impersonation)

3. Occurrence of Offence:
   Day: Wednesday              Date: 11-03-2026     Time: 14:00 - 22:30 HRS
   Place of Occurrence: Kashmere Gate Metro Concourse and Inter-State Bus Terminus

4. Complainant / Informant:
   Name: Inspector Arvind Rawat
   Father's Name: Late Sh. M. S. Rawat
   Designation: Sub-Inspector, Special Task Force, Delhi Police
   Contact Number: +91-9810456789

5. Details of Known / Suspected / Accused Persons:
   (i) Name: Rajesh Sharma @ Bhaiji
       Alias: Bhaiji
       Phone: +91-9871234567
       Role: Primary Syndicate Mastermind / Fund Layerer
   (ii) Name: Irfan Khan @ Chhotu
       Alias: Chhotu
       Phone: +91-9811098765
       Role: Field Courier / Cash Extractor
   (iii) Name: Amit Verma
       Phone: +91-9999887766
       Role: Shell Entity Proprietor (Apex Logistics)

6. Vehicle Details Identified at Crime Scene:
   Vehicle Make: Black Bajaj Pulsar / Hyundai Creta
   Registration Number: DL 08 CA 4921

7. Narrative / Facts of the Case:
   During routine surveillance against organized hawala and vehicle theft syndicates, confidential intelligence was received that accused Rajesh Sharma @ Bhaiji along with courier Irfan @ Chhotu was operating an active cash structuring pipeline using clone ATM cards and shell entity bank accounts at Axis Bank and HDFC Bank. On 11-03-2026, courier Irfan @ Chhotu was observed arriving on motorcycle DL 08 CA 4921 and executing structured withdrawals under the 50,000 threshold across three ATMs in Kashmere Gate. Substantial ledgers and digital devices were recovered from vehicle DL 08 CA 4921. Case registered for multi-state syndication under BNS 111.`;

export const SAMPLE_CSV_TEXT = `Date,Transaction ID,Description,Withdrawal (INR),Deposit (INR),Balance (INR),Channel,Location
2026-03-01,TXN9948102,IMPS Transfer from Irfan K.,0.00,240000.00,240000.00,IMPS/NetBanking,New Delhi
2026-03-02,TXN9948211,ATM Cash Withdrawal,49500.00,0.00,190500.00,ATM-4421,Kashmere Gate
2026-03-02,TXN9948212,ATM Cash Withdrawal,49500.00,0.00,141000.00,ATM-4422,Kashmere Gate
2026-03-03,TXN9948301,UPI Transfer to Shell Logistics,45000.00,0.00,96000.00,UPI,Okhla Phase 2
2026-03-03,TXN9948309,ATM Cash Withdrawal,49000.00,0.00,47000.00,ATM-4425,ISBT Concourse
2026-03-04,TXN9948410,Cash Deposit by Rajesh Sharma,0.00,350000.00,397000.00,Branch CDM,Kashmere Gate`;

export interface ExtractedEntities {
    accused?: Array<{ name: string; alias?: string; phone?: string; role?: string }>;
    complainant?: { name: string; designation?: string; phone?: string };
    witnesses?: Array<{ name: string; role?: string }>;
    acts_and_sections?: Array<{ act?: string; section?: string; statute?: string }>;
    vehicles?: Array<{ make?: string; registration?: string; plate?: string }>;
    incident_datetime?: string;
    place_of_occurrence?: string;
    police_station?: string;
    district?: string;
    fir_number?: string;
    narrative?: string;
    transcribed_text?: string;
    confidence?: number;
}

export function parseTextEvidence(text: string): ExtractedEntities {
    const result: ExtractedEntities = {
        accused: [],
        acts_and_sections: [],
        vehicles: [],
    };

    if (!text || typeof text !== "string") return result;

    const firMatch = text.match(/FIR\s*(?:No\.?|Number)?\s*[:=-]?\s*([A-Za-z0-9\/\-_]+)/i);
    if (firMatch) result.fir_number = firMatch[1].trim();

    const psMatch = text.match(/Police\s*Station\s*[:=-]?\s*([A-Za-z\s]+?)(?=\s*Year|\s*District|\s*\n|$)/i);
    if (psMatch) result.police_station = psMatch[1].trim();

    const distMatch = text.match(/District\s*[:=-]?\s*([A-Za-z\s]+?)(?=\s*Police|\s*\n|$)/i);
    if (distMatch) result.district = distMatch[1].trim();

    const dtMatch = text.match(/(?:Date\s*&\s*Time|Occurrence\s*of\s*Offence|Time)\s*[:=-]?\s*([^\n\r]+)/i);
    if (dtMatch) result.incident_datetime = dtMatch[1].trim();

    const placeMatch = text.match(/Place\s*of\s*Occurrence\s*[:=-]?\s*([^\n\r]+)/i);
    if (placeMatch) result.place_of_occurrence = placeMatch[1].trim();

    const compNameMatch = text.match(/(?:Complainant|Informant)[\s\S]*?Name\s*[:=-]?\s*([^\n\r]+)/i);
    if (compNameMatch) {
        result.complainant = { name: compNameMatch[1].trim() };
    }

    const accusedBlockMatch = text.match(/(?:Accused|Suspected\s*Persons)[\s\S]*?(?=(?:Vehicle|Narrative|Acts|$))/i);
    if (accusedBlockMatch) {
        const accusedBlock = accusedBlockMatch[0];
        const itemRegex = /Name\s*[:=-]?\s*([^\n\r]+)(?:[\s\S]*?Alias\s*[:=-]?\s*([^\n\r]+))?(?:[\s\S]*?Role\s*[:=-]?\s*([^\n\r]+))?/gi;
        let match;
        while ((match = itemRegex.exec(accusedBlock)) !== null) {
            const rawName = match[1]?.replace(/^[\(0-9\)\s\.\-]+/, "").trim();
            if (rawName && !rawName.toLowerCase().includes("informant")) {
                result.accused?.push({
                    name: rawName,
                    alias: match[2]?.trim(),
                    role: match[3]?.trim() || "Accused",
                });
            }
        }
    }

    const regMatch = text.match(/(?:Registration\s*Number|Vehicle\s*Number|Plate)\s*[:=-]?\s*([A-Z]{2}\s*[0-9]{1,2}\s*[A-Z]{1,3}\s*[0-9]{1,4})/i);
    if (regMatch) {
        result.vehicles?.push({
            plate: regMatch[1].trim(),
            registration: regMatch[1].trim(),
        });
    }

    const bnsRegex = /(?:Bharatiya\s*Nyaya\s*Sanhita|BNS|IPC|IT\s*Act)[^\n\r0-9]*Section\s*([0-9A-Za-z\(\)]+)[^\n\r]*/gi;
    let bnsMatch;
    while ((bnsMatch = bnsRegex.exec(text)) !== null) {
        result.acts_and_sections?.push({
            act: bnsMatch[0].split("-")[0]?.trim() || "Statute",
            section: bnsMatch[1]?.trim(),
        });
    }

    const narrativeMatch = text.match(/(?:Narrative|Facts\s*of\s*the\s*Case)\s*[:=-]?\s*([\s\S]+)$/i);
    if (narrativeMatch) {
        result.narrative = narrativeMatch[1].trim();
    }

    return result;
}

export function synthesizeFactSheetFromDocuments(
    documents: Document[],
    caseId: string,
    caseTitle: string,
    track: 1 | 2 = 2,
    triageReason = "Multi-channel evidence parsed."
): FactSheetData {
    const whoList: FactSheetData["who"] = [];
    const whatList: FactSheetData["what"] = [];
    const whenList: FactSheetData["when"] = [];
    const whereList: FactSheetData["where"] = [];
    const evidenceList: FactSheetData["evidence"] = [];

    let detectedFirNumber = caseTitle;

    documents.forEach((doc, idx) => {
        let ext = (doc.extracted_information as Record<string, any>) || {};

        if (
            (!ext.accused || ext.accused.length === 0) &&
            (ext.transcribed_text || doc.description || ext.text)
        ) {
            const rawText = String(ext.transcribed_text || doc.description || ext.text);
            const parsed = parseTextEvidence(rawText);
            ext = { ...parsed, ...ext };
        }

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
            note: ext.narrative
                ? `${ext.narrative.slice(0, 60)}...`
                : ext.transcribed_text
                ? `${String(ext.transcribed_text).slice(0, 60)}...`
                : `Status: ${doc.status}`,
        });

        if (ext.fir_number && (!detectedFirNumber || detectedFirNumber.startsWith("case-"))) {
            detectedFirNumber = `FIR ${ext.fir_number}`;
        }

        if (Array.isArray(ext.accused)) {
            ext.accused.forEach((acc: any, aIdx: number) => {
                if (acc.name && !whoList.some((w) => w.name.toLowerCase() === acc.name.toLowerCase())) {
                    whoList.push({
                        id: `acc-${idx}-${aIdx}`,
                        name: acc.name,
                        role: acc.role || "Accused",
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

        if (ext.complainant?.name && !whoList.some((w) => w.name.toLowerCase() === ext.complainant.name.toLowerCase())) {
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

        if (Array.isArray(ext.witnesses)) {
            ext.witnesses.forEach((w: any, wIdx: number) => {
                if (w.name && !whoList.some((p) => p.name.toLowerCase() === w.name.toLowerCase())) {
                    whoList.push({
                        id: `wit-${idx}-${wIdx}`,
                        name: w.name,
                        role: "Witness",
                        citation: {
                            documentTitle: doc.title,
                            confidenceScore: 0.92,
                            rawSnippet: `Witness: ${w.name}`,
                        },
                    });
                }
            });
        }

        if (Array.isArray(ext.acts_and_sections)) {
            ext.acts_and_sections.forEach((sec: any) => {
                const secStr = `${sec.act || "BNS"} Section ${sec.section || ""}`.trim();
                if (!whatList.some((item) => item.bnsSection === secStr)) {
                    whatList.push({
                        bnsSection: secStr,
                        statuteName: sec.statute || "Statutory Taxonomy",
                        description: ext.narrative || "Recorded from case document.",
                        applicableTo: ext.accused?.[0]?.name || "Accused",
                        citation: {
                            documentTitle: doc.title,
                            confidenceScore: 0.95,
                        },
                    });
                }
            });
        }

        if (ext.incident_datetime) {
            whenList.push({
                timestamp: ext.incident_datetime,
                event: ext.narrative || "Incident / Occurrence of offence",
                location: ext.place_of_occurrence || ext.police_station || "Jurisdiction",
                citation: {
                    documentTitle: doc.title,
                    confidenceScore: 0.94,
                },
            });
        }

        if (ext.place_of_occurrence || ext.police_station || ext.district) {
            const locName = ext.place_of_occurrence || `${ext.police_station || ""}, ${ext.district || ""}`.replace(/^, |, $/g, "");
            if (!whereList.some((w) => w.locationName === locName)) {
                whereList.push({
                    locationName: locName,
                    jurisdiction: ext.district || "State Police",
                    significance: ext.place_of_occurrence ? "Crime Scene" : "Jurisdiction",
                    coordinates: [28.6667, 77.2333],
                    citation: {
                        documentTitle: doc.title,
                        confidenceScore: 0.92,
                    },
                });
            }
        }
    });

    return {
        caseId,
        firNumber: detectedFirNumber || "Active Investigation",
        track,
        triageReason: triageReason || (whoList.length > 2 ? "Multi-state syndicate network detected." : "Evidence ingested."),
        who: whoList,
        what: whatList,
        when: whenList,
        where: whereList,
        evidence: evidenceList,
        knownRelationships: [],
        openGaps: [],
    };
}
