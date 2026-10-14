import { useState } from "react";
import { X, Lock, User, Mail, Shield, CheckCircle } from "lucide-react";
import { loginUser, registerUser } from "../api.js";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await registerUser({ username, email, password, full_name: fullName });
        onAuthSuccess(user);
      } else {
        const user = await loginUser({ username, password });
        onAuthSuccess(user);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setError(null);
    setLoading(true);
    try {
      const creds =
        role === "admin"
          ? { username: "admin", password: "admin1234" }
          : { username: "demo_user", password: "demo1234" };

      const user = await loginUser(creds);
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError("Preset login failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-scrim">
      <div className="modal-panel auth-modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <Lock size={18} />
            <h2>{isRegister ? "Register Clinical Account" : "Platform Authentication"}</h2>
          </div>
          <button className="toast-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. dr_smith"
              className="text-input"
            />
          </div>

          {isRegister && (
            <>
              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.org"
                  className="text-input"
                />
              </div>
              <div className="field">
                <label>Full Name / Title</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Jane Smith, MD"
                  className="text-input"
                />
              </div>
            </>
          )}

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="text-input"
            />
          </div>

          <div className="auth-form-actions">
            <button type="submit" className="primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </div>
        </form>

        <div className="auth-toggle-row">
          <span>{isRegister ? "Already registered?" : "Need an account?"}</span>
          <button className="link-btn" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Sign In instead" : "Register here"}
          </button>
        </div>

        {/* 1-Click Quick Presets */}
        <div className="quick-presets-section">
          <div className="quick-presets-label">
            <Shield size={13} />
            <span>Instant Demo Sign-in</span>
          </div>
          <div className="quick-presets-grid">
            <button
              className="ghost-btn preset-btn"
              onClick={() => handleQuickLogin("demo")}
              disabled={loading}
            >
              <User size={14} />
              Demo Clinician
            </button>
            <button
              className="ghost-btn preset-btn"
              onClick={() => handleQuickLogin("admin")}
              disabled={loading}
            >
              <Shield size={14} />
              Platform Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
