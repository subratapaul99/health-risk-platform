import {
  Activity,
  LayoutDashboard,
  Sliders,
  History,
  FileSpreadsheet,
  Server,
  BookOpen,
  Info,
  Moon,
  Sun,
  User,
  LogOut,
  MessageSquareHeart,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "assistant", label: "AI Health Assistant", icon: MessageSquareHeart },
  { id: "simulate", label: "What-If Simulator", icon: Sliders },
  { id: "history", label: "Risk Trajectory", icon: History },
  { id: "batch", label: "Batch Screening", icon: FileSpreadsheet },
  { id: "admin", label: "Model Registry", icon: Server },
  { id: "documentary", label: "Technical Docs", icon: BookOpen },
  { id: "about", label: "About Platform", icon: Info },
];

export default function Sidebar({
  view,
  onNavigate,
  mobileOpen,
  currentUser,
  onOpenAuth,
  onLogout,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <Activity size={22} />
        <span>Health Risk AI</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item ${view === id ? "active" : ""}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* User Session Bar */}
      <div className="sidebar-user-section">
        {currentUser ? (
          <div className="sidebar-user-card">
            <div className="user-info-text">
              <span className="user-name">{currentUser.full_name || currentUser.username}</span>
              <span className="user-role">{currentUser.is_admin ? "Administrator" : "Clinician"}</span>
            </div>
            <button className="user-logout-btn" title="Sign Out" onClick={onLogout}>
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button className="sidebar-nav-item auth-btn-sidebar" onClick={onOpenAuth}>
            <User size={18} />
            <span>Sign In / Demo</span>
          </button>
        )}
      </div>

      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
      </button>
    </aside>
  );
}
