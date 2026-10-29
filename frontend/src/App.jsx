import { useState, useEffect } from "react";
import { Menu, MessageSquareHeart } from "lucide-react";
import ChatAssistant from "./components/ChatAssistant.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import DashboardView from "./components/DashboardView.jsx";
import HistoryView from "./components/HistoryView.jsx";
import AboutView from "./components/AboutView.jsx";
import BatchView from "./components/BatchView.jsx";
import SimulationView from "./components/SimulationView.jsx";
import AdminView from "./components/AdminView.jsx";
import DocumentaryView from "./components/DocumentaryView.jsx";
import AuthModal from "./components/AuthModal.jsx";
import { ToastStack, useToasts } from "./components/Toast.jsx";
import { fetchHistory, submitAssessment, logoutUser } from "./api.js";

const DEFAULT_USER_ID = "demo_user";

function AppShell() {
  const [view, setView] = useState("dashboard");
  const [result, setResult] = useState(null);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const { toasts, pushToast, dismissToast } = useToasts();

  // Load existing session info on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("health_user_info");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        // ignore parse error
      }
    }
    // Load initial history
    fetchHistory(DEFAULT_USER_ID)
      .then((h) => setHistory(h.history || []))
      .catch(() => {});
  }, []);

  const activeUserId = currentUser?.username || DEFAULT_USER_ID;

  async function handleSubmit(payload) {
    setLoading(true);
    try {
      const formattedPayload = { ...payload, user_id: activeUserId };
      const response = await submitAssessment(formattedPayload);
      setResult(response);
      setLatestAssessment(payload);

      const h = await fetchHistory(activeUserId);
      setHistory(h.history || []);
      pushToast("Clinical assessment and SHAP attribution completed.", "success");
    } catch (err) {
      pushToast(err.response?.data?.detail || "Assessment submission failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleNavigate(id) {
    setView(id);
    setMobileNavOpen(false);
  }

  function handleAuthSuccess(user) {
    setCurrentUser(user);
    pushToast(`Welcome, ${user.full_name || user.username}!`, "success");
    // Reload user history
    fetchHistory(user.username)
      .then((h) => setHistory(h.history || []))
      .catch(() => {});
  }

  function handleLogout() {
    logoutUser();
    setCurrentUser(null);
    pushToast("Signed out successfully.", "success");
  }

  return (
    <div className="layout">
      <Sidebar
        view={view}
        onNavigate={handleNavigate}
        mobileOpen={mobileNavOpen}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {mobileNavOpen && (
        <div className="sidebar-scrim no-print" onClick={() => setMobileNavOpen(false)} />
      )}

      <main className="main-content">
        <button
          className="mobile-nav-toggle no-print"
          onClick={() => setMobileNavOpen((v) => !v)}
        >
          <Menu size={20} />
        </button>

        {view === "dashboard" && (
          <DashboardView
            result={result}
            history={history}
            loading={loading}
            onSubmit={handleSubmit}
            onError={(msg) => pushToast(msg, "error")}
            userId={activeUserId}
            latestPayload={latestAssessment}
            onNavigateToSim={() => handleNavigate("simulate")}
          />
        )}
        {view === "assistant" && (
          <div className="view-page">
            <div className="view-header">
              <h1>
                <MessageSquareHeart size={24} />
                Clinical AI Health Assistant
              </h1>
              <p>
                Interactive evidence-based clinical guidance aligned with the American Diabetes Association (ADA)
                Standards of Care. Ask about nutrition, exercise, insulin resistance, or lab tests.
              </p>
            </div>
            <ChatAssistant
              patientVitals={latestAssessment}
              result={result}
              userId={activeUserId}
              onNavigateToSim={() => handleNavigate("simulate")}
              isStandaloneView={true}
            />
          </div>
        )}

        {view === "simulate" && (
          <SimulationView
            latestAssessment={latestAssessment}
            onApplyToForm={(vals) => {
              setLatestAssessment(vals);
              setView("dashboard");
            }}
          />
        )}
        {view === "history" && (
          <HistoryView history={history} userId={activeUserId} />
        )}
        {view === "batch" && (
          <BatchView onError={(msg) => pushToast(msg, "error")} />
        )}
        {view === "admin" && <AdminView />}
        {view === "documentary" && <DocumentaryView />}
        {view === "about" && <AboutView />}
      </main>

      {/* Global Floating AI Health Assistant */}
      {view !== "assistant" && (
        <ChatAssistant
          patientVitals={latestAssessment}
          result={result}
          userId={activeUserId}
          onNavigateToSim={() => handleNavigate("simulate")}
          isStandaloneView={false}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
