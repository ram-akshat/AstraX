import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import CaseView from "../pages/CaseView";
import EvidenceIntake from "../pages/EvidenceIntake";
import ExtractionSummary from "../pages/ExtractionSummary";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/intake" element={<EvidenceIntake />} />
            <Route path="/intake/:caseId/summary" element={<ExtractionSummary />} />
            <Route path="/cases/:caseId/summary" element={<ExtractionSummary />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases/:caseId" element={<CaseView />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}