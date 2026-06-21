import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ReportPage from "./pages/ReportPage";
import AlertCard from "./pages/AlertCard";
import TipSubmission from "./pages/TipSubmission";
import FamilyDashboard from "./pages/FamilyDashboard";
import Portal from "./pages/Portal";
import ProtectedRoute from "./pages/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/alert/:caseId" element={<AlertCard />} />
        <Route path="/tip/:caseId" element={<TipSubmission />} />
        <Route path="/dashboard/:caseId" element={<FamilyDashboard />} />
        <Route
          path="/portal"
          element={
            <ProtectedRoute label="Police / Admin">
              <Portal />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;