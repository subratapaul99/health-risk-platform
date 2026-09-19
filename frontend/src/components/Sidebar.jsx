import { Activity, LayoutDashboard, History, FileSpreadsheet, Info, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "batch", label: "Batch screening", icon: FileSpreadsheet },
  { id: "history", label: "History", icon: History },
  { id: "about", label: "Model info", icon: Info },
];

export default function Sidebar({ view, onNavigate, mobileOpen }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="sidebar-brand">
        <Activity size={22} />
        <span>Health Risk</span>
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

      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
      </button>
    </aside>
  );
}
