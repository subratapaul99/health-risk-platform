import { useState } from "react";
import { Menu } from "lucide-react";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import DashboardView from "./components/DashboardView.jsx";
import HistoryView from "./components/HistoryView.jsx";
import AboutView from "./components/AboutView.jsx";
import BatchView from "./components/BatchView.jsx";
import { ToastStack, useToasts } from "./components/Toast.jsx";
import { fetchHistory, submitAssessment } from "./api.js";

const USER_ID = "demo_user";

function AppShell() {
  const [view, setView] = useState("dashboard");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { toasts, pushToast, dismissToast } = useToasts();

  async function handleSubmit(payload) {
    setLoading(true);
    try {
      const response = await submitAssessment(payload);
      setResult(response);
      const h = await fetchHistory(USER_ID);
      setHistory(h.history);
      pushToast("Assessment complete.", "success");
    } finally {
      setLoading(false);
    }
  }

  function handleNavigate(id) {
    setView(id);
    setMobileNavOpen(false);
  }

  return (
    <div className="layout">
      <Sidebar view={view} onNavigate={handleNavigate} mobileOpen={mobileNavOpen} />
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
            userId={USER_ID}
          />
        )}
        {view === "history" && <HistoryView history={history} />}
        {view === "batch" && <BatchView onError={(msg) => pushToast(msg, "error")} />}
        {view === "about" && <AboutView />}
      </main>

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
