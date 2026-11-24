import { Route, Routes } from "react-router-dom";
import { ReportDetailPage } from "./pages/ReportDetailPage";
import { ReportFormPage } from "./pages/ReportFormPage";
import { ReportListPage } from "./pages/ReportListPage";

export function App() {
    return (
        <main>
            <Routes>
                <Route path="/" element={<ReportListPage />} />
                <Route path="/report/:id" element={<ReportDetailPage />} />
                <Route path="/new" element={<ReportFormPage />} />
            </Routes>
        </main>
    );
}
