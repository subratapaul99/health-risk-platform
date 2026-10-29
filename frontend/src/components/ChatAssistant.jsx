import { useState, useEffect, useRef } from "react";
import {
  MessageSquareHeart,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  User,
  Bot,
  AlertTriangle,
  RotateCcw,
  Mic,
  MicOff,
  Sliders,
  FileCheck2,
  ChevronDown,
} from "lucide-react";
import { sendChatMessage } from "../api.js";

const DEFAULT_WELCOME_MESSAGE = {
  sender: "assistant",
  text: `### 🩺 Hello, I'm your Clinical AI Health Assistant!

I analyze your metabolic biomarkers and provide evidence-based guidance aligned with the **American Diabetes Association (ADA)** guidelines.

**How can I help you today?**
• Interpret your diabetes risk probability and biomarker drivers
• Personalized nutrition, low-glycemic foods, and meal planning
• Safe exercise and physical activity targets
• Explain insulin resistance and HOMA-IR levels`,
  suggestedPrompts: [
    "What does my risk score mean?",
    "What foods lower blood glucose?",
    "How can I reduce my risk by 30%?",
    "Explain my HOMA-IR score",
  ],
};

export default function ChatAssistant({
  patientVitals,
  result,
  userId,
  onNavigateToSim,
  onOpenLabRequisition,
  isStandaloneView = false,
}) {
  const [isOpen, setIsOpen] = useState(isStandaloneView);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll message stream to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Build context packet to send with each user query
  const patientContext = {
    user_id: userId,
    glucose: patientVitals?.glucose || result?.glucose,
    bmi: patientVitals?.bmi || result?.bmi,
    blood_pressure: patientVitals?.blood_pressure || result?.blood_pressure,
    insulin: patientVitals?.insulin || result?.insulin,
    age: patientVitals?.age || result?.age,
    risk_score: result?.risk_score,
    risk_band: result?.risk_band,
    homa_ir: result?.homa_ir,
    ascvd_10yr_risk: result?.ascvd_10yr_risk,
  };

  const hasContext = Boolean(patientContext.glucose || patientContext.bmi || patientContext.risk_score);

  async function handleSend(queryText = null) {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    setInput("");
    const userMessage = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const response = await sendChatMessage(textToSend, patientContext, historyPayload);

      const assistantMessage = {
        sender: "assistant",
        text: response.reply,
        suggestedPrompts: response.suggested_prompts || [],
        clinicalAlert: response.clinical_alert,
        relevantBiomarkers: response.relevant_biomarkers || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "I encountered a communication issue connecting to the clinical intelligence server. Please ensure the backend is running or consult your medical provider for acute concerns.",
          suggestedPrompts: ["What foods lower blood sugar?", "Explain my risk score"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleResetChat() {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
  }

  // Voice speech-to-text dictation
  function toggleSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  }

  // Parse markdown-style text into readable HTML
  function renderFormattedText(text) {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} style={{ margin: "8px 0 4px", fontSize: 14, fontWeight: 700, color: "var(--brand)" }}>{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("• ") || line.startsWith("* ")) {
        const content = line.substring(2);
        return (
          <li key={idx} style={{ marginLeft: 16, marginBottom: 3, lineHeight: 1.45, fontSize: 13 }}>
            <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} style={{ height: 6 }} />;
      }
      return (
        <p key={idx} style={{ margin: "2px 0 6px", lineHeight: 1.45, fontSize: 13 }} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    });
  }

  function formatInline(str) {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='inline-code'>$1</code>");
  }

  // Floating button when collapsed
  if (!isOpen && !isStandaloneView) {
    return (
      <button
        className="chat-floating-btn no-print"
        onClick={() => setIsOpen(true)}
        title="Open Clinical AI Health Assistant"
      >
        <div className="chat-btn-icon-wrap">
          <MessageSquareHeart size={22} />
          <span className="online-ping" />
        </div>
        <div className="chat-btn-label">
          <strong>AI Health Assistant</strong>
          <span>Evidence-Based Advice</span>
        </div>
      </button>
    );
  }

  return (
    <div className={`chat-assistant-container ${isStandaloneView ? "standalone-view" : "floating-window"} ${isMinimized ? "minimized" : ""}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar-badge">
            <Bot size={18} />
          </div>
          <div>
            <div className="chat-title-row">
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Clinical AI Health Assistant</h3>
              <span className="live-status-pill">
                <span className="live-dot" /> Online
              </span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              ADA Guidelines • Metabolic & Lifestyle Guidance
            </span>
          </div>
        </div>

        <div className="chat-header-actions no-print">
          <button
            className="ghost-btn icon-only"
            onClick={handleResetChat}
            title="Reset Conversation"
          >
            <RotateCcw size={14} />
          </button>
          {!isStandaloneView && (
            <button
              className="ghost-btn icon-only"
              onClick={() => setIsMinimized((v) => !v)}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
          )}
          {!isStandaloneView && (
            <button
              className="ghost-btn icon-only"
              onClick={() => setIsOpen(false)}
              title="Close Assistant"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Active Patient Vitals Context Bar */}
          {hasContext && (
            <div className="chat-context-strip">
              <span className="context-label">
                <User size={12} /> Active Vitals:
              </span>
              {patientContext.glucose && <span className="context-chip">Glucose: <strong>{patientContext.glucose}</strong></span>}
              {patientContext.bmi && <span className="context-chip">BMI: <strong>{patientContext.bmi}</strong></span>}
              {patientContext.risk_score !== undefined && (
                <span className={`context-chip risk-chip ${patientContext.risk_band}`}>
                  Risk: <strong>{(patientContext.risk_score * 100).toFixed(1)}%</strong>
                </span>
              )}
              {patientContext.homa_ir && <span className="context-chip">HOMA-IR: <strong>{patientContext.homa_ir}</strong></span>}
            </div>
          )}

          {/* Message Stream */}
          <div className="chat-messages-stream">
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";
              return (
                <div key={index} className={`chat-message-row ${isUser ? "user-row" : "assistant-row"}`}>
                  <div className="msg-avatar">
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  <div className="msg-body">
                    {msg.clinicalAlert && (
                      <div className="msg-clinical-alert">
                        <AlertTriangle size={15} />
                        <span>{msg.clinicalAlert}</span>
                      </div>
                    )}

                    <div className="msg-bubble">
                      {isUser ? msg.text : renderFormattedText(msg.text)}
                    </div>

                    {/* Quick Suggestion Prompt Chips */}
                    {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                      <div className="suggested-chips-row">
                        {msg.suggestedPrompts.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            className="prompt-chip"
                            onClick={() => handleSend(prompt)}
                            disabled={loading}
                          >
                            <Sparkles size={11} />
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="chat-message-row assistant-row">
                <div className="msg-avatar"><Bot size={14} /></div>
                <div className="msg-body">
                  <div className="msg-bubble typing-indicator">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Shortcuts Toolbar */}
          <div className="chat-shortcuts-bar no-print">
            {onNavigateToSim && (
              <button
                className="shortcut-btn"
                onClick={onNavigateToSim}
                title="Launch Counterfactual What-If Simulator"
              >
                <Sliders size={12} />
                What-If Simulator
              </button>
            )}
            {onOpenLabRequisition && (
              <button
                className="shortcut-btn"
                onClick={onOpenLabRequisition}
                title="Open Clinical Lab Order Slip"
              >
                <FileCheck2 size={12} />
                Order Diagnostic Labs
              </button>
            )}
          </div>

          {/* Input Box */}
          <div className="chat-input-area no-print">
            <textarea
              className="chat-textarea"
              placeholder="Ask a health question (e.g. 'What diet lowers glucose?', 'Explain my score')..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              className={`chat-icon-btn ${isListening ? "active" : ""}`}
              onClick={toggleSpeech}
              title="Dictate message using microphone"
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              type="button"
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              title="Send Message"
            >
              <Send size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
