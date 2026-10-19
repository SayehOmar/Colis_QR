import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { WelcomeTrustModal } from "./components/WelcomeTrustModal";
import AboutPage from "./pages/AboutPage";
import BillingPage from "./pages/BillingPage";
import ChooseRolePage from "./pages/ChooseRolePage";
import DashboardPage from "./pages/DashboardPage";
import HomeRolePage from "./pages/HomeRolePage";
import LandingPage from "./pages/LandingPage";
import LegalPage from "./pages/LegalPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import ShipmentFormPage from "./pages/ShipmentFormPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import WelcomePage from "./pages/WelcomePage";

export default function App() {
  return (
    <>
    <WelcomeTrustModal />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/terms" element={<LegalPage kind="terms" />} />
      <Route path="/privacy" element={<LegalPage kind="privacy" />} />
      <Route path="/refund" element={<LegalPage kind="refund" />} />
      <Route path="/start" element={<HomeRolePage />} />
      <Route path="/client" element={<ShipmentFormPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route
        path="/choose-role"
        element={
          <ProtectedRoute requireVerified>
            <ChooseRolePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute requireVerified>
            <BillingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute requireVerified>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireAccess requireVerified>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
