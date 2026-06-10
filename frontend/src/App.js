import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { supabase } from "./supabase";
import { motion, AnimatePresence } from "framer-motion";

const WARM = {
  cream: "#F5EDE0",
  beige: "#DFC9A8",
  tan: "#B8924A",
  brown: "#7A5C2E",
  darkBrown: "#4A3520",
  sage: "#8FA882",
  softWhite: "#EDE0CE",
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
  transition: { duration: 0.35, ease: "easeOut" },
};

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const item = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function ScoreRing({ value, label, color }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-2"
    >
      <div style={{ width: 80, height: 80 }}>
        <CircularProgressbar value={value} text={`${value}%`}
          styles={buildStyles({ textSize: "22px", pathColor: color, textColor: "#5C4008", trailColor: "#E8D5B7", strokeLinecap: "round" })}
        />
      </div>
      <span style={{ color: WARM.darkBrown }} className="text-xs font-medium text-center">{label}</span>
    </motion.div>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? WARM.tan : "none"}
      stroke={active ? WARM.tan : WARM.brown} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function CaptureIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? WARM.tan : "none"}
      stroke={active ? WARM.tan : WARM.brown} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function AnalysisIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? WARM.tan : WARM.brown} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function HistoryIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? WARM.tan : WARM.brown} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function AnalysisSection({ title, summaryItems, detailItems }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      variants={item}
      style={{ backgroundColor: WARM.softWhite, borderColor: WARM.beige }}
      className="rounded-2xl border p-4 mb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <p style={{ color: WARM.brown }} className="font-bold italic text-xs uppercase tracking-wider">
          {title}
        </p>
        {detailItems && detailItems.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(!expanded)}
            style={{ color: WARM.tan, borderColor: WARM.beige }}
            className="text-xs font-medium border px-2.5 py-1 rounded-full"
          >
            {expanded ? "See less" : "See more"}
          </motion.button>
        )}
      </div>
      <div className="space-y-1.5">
        {summaryItems && summaryItems.map((bullet, i) => (
          <div key={i} className="flex items-start gap-2">
            <span style={{ color: WARM.tan }} className="mt-0.5 text-xs flex-shrink-0">▸</span>
            <p style={{ color: WARM.darkBrown }} className="text-xs leading-relaxed">{bullet}</p>
          </div>
        ))}
        <AnimatePresence>
          {expanded && detailItems && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-1.5 pt-1"
            >
              {detailItems.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: WARM.beige }} className="mt-0.5 text-xs flex-shrink-0">▸</span>
                  <p style={{ color: WARM.brown }} className="text-xs leading-relaxed">{bullet}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PaywallModal({ onSubscribe, onClose, loading, concernContext }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(74, 53, 32, 0.6)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
        className="w-full max-w-sm rounded-3xl border p-8 shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
          style={{ backgroundColor: WARM.tan }}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 shadow-md"
        >
          <span className="text-white font-bold text-xl">✦</span>
        </motion.div>
        <h2 style={{ color: WARM.darkBrown }} className="text-xl font-bold text-center mb-2">
          {concernContext ? `Unlock ${concernContext} Analysis` : "Unlock Deep Analysis"}
        </h2>
        <p style={{ color: WARM.tan }} className="text-sm text-center mb-6 leading-relaxed">
          {concernContext
            ? `Get a full personalized analysis focused on ${concernContext.toLowerCase()} with a Premium subscription.`
            : "You've used your 2 free deep analyses. Subscribe to get unlimited access."}
        </p>
        <div style={{ backgroundColor: WARM.softWhite, borderColor: WARM.beige }}
          className="rounded-2xl border p-4 mb-6 space-y-2">
          {[
            "Unlimited deep skin analyses",
            "Concern-focused targeted reports",
            "Full nutrition & diet recommendations",
            "Personalized skincare routines",
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-2">
              <span style={{ color: WARM.sage }} className="text-sm">✓</span>
              <p style={{ color: WARM.darkBrown }} className="text-xs">{feat}</p>
            </div>
          ))}
        </div>
        <div className="text-center mb-6">
          <span style={{ color: WARM.darkBrown }} className="text-3xl font-bold">$4.99</span>
          <span style={{ color: WARM.tan }} className="text-sm"> / month</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onSubscribe} disabled={loading}
          style={{ backgroundColor: WARM.tan }}
          className="w-full py-3.5 rounded-full text-white font-bold text-sm shadow-md disabled:opacity-60"
        >
          {loading ? "Redirecting to checkout..." : "Subscribe — $4.99/month"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }} onClick={onClose}
          style={{ color: WARM.brown }}
          className="w-full text-center text-xs mt-3 py-2"
        >
          Maybe later
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function AnalysisEmptyState({ onGoToCapture }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg flex flex-col items-center justify-center gap-6 py-12"
    >
      <motion.div className="relative">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          style={{ backgroundColor: WARM.beige }}
          className="absolute inset-0 rounded-full blur-xl"
        />
        <motion.div
          style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
          className="relative w-40 h-40 rounded-full border-2 flex items-center justify-center shadow-sm"
        >
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <ellipse cx="36" cy="38" rx="24" ry="26" fill={WARM.beige} stroke={WARM.tan} strokeWidth="1.5"/>
            <ellipse cx="27" cy="33" rx="3" ry="3.5" fill={WARM.brown}/>
            <ellipse cx="45" cy="33" rx="3" ry="3.5" fill={WARM.brown}/>
            <circle cx="28.2" cy="31.8" r="1" fill="white"/>
            <circle cx="46.2" cy="31.8" r="1" fill="white"/>
            <path d="M27 44 Q36 51 45 44" stroke={WARM.brown} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <motion.g animate={{ opacity: [0, 0.6, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
              <line x1="14" y1="28" x2="58" y2="28" stroke={WARM.tan} strokeWidth="0.8" strokeDasharray="3 3"/>
              <line x1="14" y1="36" x2="58" y2="36" stroke={WARM.tan} strokeWidth="0.8" strokeDasharray="3 3"/>
              <line x1="14" y1="44" x2="58" y2="44" stroke={WARM.tan} strokeWidth="0.8" strokeDasharray="3 3"/>
            </motion.g>
            <path d="M14 20 L14 14 L20 14" stroke={WARM.tan} strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M58 20 L58 14 L52 14" stroke={WARM.tan} strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M14 56 L14 62 L20 62" stroke={WARM.tan} strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M58 56 L58 62 L52 62" stroke={WARM.tan} strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </motion.div>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
          style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
          className="absolute -right-6 top-6 border rounded-xl px-2.5 py-1.5 shadow-sm"
        >
          <p style={{ color: WARM.tan }} className="text-xs font-bold">---%</p>
          <p style={{ color: WARM.brown, fontSize: 9 }} className="text-xs">Clarity</p>
        </motion.div>
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut", delay: 0.6 }}
          style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
          className="absolute -left-6 bottom-8 border rounded-xl px-2.5 py-1.5 shadow-sm"
        >
          <p style={{ color: WARM.sage }} className="text-xs font-bold">---%</p>
          <p style={{ color: WARM.brown, fontSize: 9 }} className="text-xs">Moisture</p>
        </motion.div>
      </motion.div>
      <div className="text-center px-4">
        <p style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-2">No Analysis Yet</p>
        <p style={{ color: WARM.tan }} className="text-sm leading-relaxed max-w-xs mx-auto">
          Run a Deep Analysis from the Capture tab to unlock your full personalized skin report.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onGoToCapture}
        style={{ backgroundColor: WARM.tan }}
        className="px-8 py-3 rounded-full text-white font-semibold text-sm shadow-md"
      >
        Start Deep Analysis
      </motion.button>
    </motion.div>
  );
}

// Face guide overlay — oval with corner brackets
function FaceGuideOverlay({ analyzing, deepLoading }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Oval face guide */}
      <div style={{ position: "relative", width: 200, height: 260 }}>
        <svg width="200" height="260" viewBox="0 0 200 260" fill="none">
          {/* Darkened outer area cutout effect */}
          <ellipse cx="100" cy="130" rx="88" ry="112"
            stroke={analyzing || deepLoading ? WARM.tan : "rgba(255,255,255,0.7)"}
            strokeWidth="2.5"
            strokeDasharray={analyzing || deepLoading ? "8 4" : "none"}
          />
          {/* Corner bracket — top left */}
          <path d="M24 60 L24 40 L44 40" stroke={WARM.tan} strokeWidth="3" strokeLinecap="round" fill="none"/>
          {/* Corner bracket — top right */}
          <path d="M176 60 L176 40 L156 40" stroke={WARM.tan} strokeWidth="3" strokeLinecap="round" fill="none"/>
          {/* Corner bracket — bottom left */}
          <path d="M24 200 L24 220 L44 220" stroke={WARM.tan} strokeWidth="3" strokeLinecap="round" fill="none"/>
          {/* Corner bracket — bottom right */}
          <path d="M176 200 L176 220 L156 220" stroke={WARM.tan} strokeWidth="3" strokeLinecap="round" fill="none"/>
        </svg>

        {/* Scanning line animation */}
        {(analyzing || deepLoading) && (
          <motion.div
            animate={{ top: ["15%", "85%", "15%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{
              position: "absolute",
              left: "8%",
              right: "8%",
              height: 2,
              background: `linear-gradient(90deg, transparent, ${WARM.tan}, transparent)`,
              borderRadius: 2,
            }}
          />
        )}
      </div>

      {/* Center hint text — only when camera is on but not analyzing */}
      {!analyzing && !deepLoading && (
        <div style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0,0,0,0.45)",
          borderRadius: 20,
          padding: "4px 12px",
          whiteSpace: "nowrap",
        }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>Center your face in the oval</p>
        </div>
      )}
    </div>
  );
}

function App({ session }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState(null);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("home");
  const [selectedReport, setSelectedReport] = useState(null);
  const [deepLoading, setDeepLoading] = useState(false);
  const [savedDeepAnalysis, setSavedDeepAnalysis] = useState(null);
  const [trialsRemaining, setTrialsRemaining] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallConcern, setPaywallConcern] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [activeConcern, setActiveConcern] = useState(null);
  const [activeAnalysisTitle, setActiveAnalysisTitle] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [notifications, setNotifications] = useState(true);

  const BACKEND = "https://skin-ai-production-d736.up.railway.app";
  const userEmail = session?.user?.email || "";

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchHistory = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND}/history`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory(data.reports);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND}/profile`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      setIsSubscribed(data.is_subscribed);
      setTrialsRemaining(data.trials_remaining);
    } catch (err) {
      console.error("Failed to fetch profile");
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchProfile();
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      fetchProfile();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`skinai_name_${userEmail}`);
    if (saved) setDisplayName(saved);
  }, [userEmail]);

  const saveName = () => {
    if (tempName.trim()) {
      setDisplayName(tempName.trim());
      localStorage.setItem(`skinai_name_${userEmail}`, tempName.trim());
    }
    setEditingName(false);
  };

  const handleConcernClick = (concern) => {
    if (!isSubscribed) {
      setPaywallConcern(concern.label);
      setShowPaywall(true);
      return;
    }
    setActiveConcern(concern.label);
    setView("scan");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      videoRef.current.srcObject = stream;
      setCameraOn(true);
      setError(null);
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); videoRef.current.srcObject = null; }
    setCameraOn(false);
    setResult(null);
    setScores(null);
    setActiveConcern(null);
  };

  const captureFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Draw unmirrored to canvas — the visual mirror is CSS only
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !cameraOn) return;
    setError(null); setResult(null); setScores(null); setAnalyzing(true);
    const base64Image = captureFrame();
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ image: base64Image, ...(activeConcern && { concern: activeConcern }) }),
      });
      const data = await response.json();
      setResult(data.analysis);
      setScores(data.scores);
      fetchHistory();
    } catch (err) {
      setError("Failed to connect to backend.");
    } finally {
      setAnalyzing(false);
    }
  };

  const runDeepAnalysis = async () => {
    if (!videoRef.current || !cameraOn) return;
    setDeepLoading(true);
    const base64Image = captureFrame();
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND}/analyze/deep`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ image: base64Image, ...(activeConcern && { concern: activeConcern }) }),
      });
      if (response.status === 402) {
        setPaywallConcern(null);
        setShowPaywall(true);
        setDeepLoading(false);
        return;
      }
      const data = await response.json();
      setSavedDeepAnalysis(data.deep_analysis);
      setActiveAnalysisTitle(activeConcern ? `${activeConcern} Focus` : null);
      setTrialsRemaining(data.trials_remaining);
      setIsSubscribed(data.is_subscribed);
      setView("analysis");
    } catch (err) {
      setError("Failed to run deep analysis.");
    } finally {
      setDeepLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch (err) {
      setError("Failed to start checkout. Please try again.");
      setCheckoutLoading(false);
    }
  };

  const deleteReport = async (id) => {
    const token = await getToken();
    await fetch(`${BACKEND}/history/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    fetchHistory();
    if (selectedReport?.id === id) setSelectedReport(null);
  };

  const mdComponents = {
    h1: ({ node, ...props }) => <h1 style={{ color: WARM.darkBrown }} className="font-bold text-lg mt-4 mb-2" {...props} />,
    h2: ({ node, ...props }) => <h2 style={{ color: WARM.brown }} className="font-bold text-base mt-4 mb-2" {...props} />,
    h3: ({ node, ...props }) => <h3 style={{ color: WARM.brown }} className="font-semibold text-sm mt-3 mb-1" {...props} />,
    strong: ({ node, ...props }) => <strong style={{ color: WARM.darkBrown }} className="font-semibold" {...props} />,
    em: ({ node, ...props }) => <em style={{ color: WARM.tan }} className="italic" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-inside mt-2 space-y-1" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mt-2 space-y-1" {...props} />,
    li: ({ node, ...props }) => <li style={{ color: "#6B4F1A" }} className="text-sm" {...props} />,
    table: ({ node, ...props }) => <div className="overflow-x-auto mt-3"><table className="w-full border-collapse text-sm" {...props} /></div>,
    th: ({ node, ...props }) => <th style={{ color: WARM.brown, borderBottomColor: WARM.beige }} className="text-left font-semibold border-b pb-2 pr-4 py-2" {...props} />,
    td: ({ node, ...props }) => <td style={{ color: "#6B4F1A", borderBottomColor: WARM.beige }} className="border-b py-2 pr-4" {...props} />,
    hr: ({ node, ...props }) => <hr style={{ borderColor: WARM.beige }} className="my-4" {...props} />,
    p: ({ node, ...props }) => <p style={{ color: "#6B4F1A" }} className="leading-relaxed mb-2 text-sm" {...props} />,
  };

  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "scan", label: "Capture", icon: CaptureIcon },
    { id: "analysis", label: "Analysis", icon: AnalysisIcon },
    { id: "history", label: "History", icon: HistoryIcon },
  ];

  const getInitials = () => {
    if (displayName) return displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    if (userEmail) return userEmail[0].toUpperCase();
    return "U";
  };

  const deepSections = savedDeepAnalysis ? [
    { key: "skin_assessment", title: "Skin Assessment" },
    { key: "nutrition", title: "Nutrition & Diet" },
    { key: "skincare", title: "Skincare Routine" },
    { key: "lifestyle", title: "Lifestyle Factors" },
    { key: "progress", title: "Weekly Progress" },
    { key: "action_plan", title: "Priority Action Plan" },
  ] : [];

  const skinConcerns = [
    { label: "Oiliness", desc: "T-zone control" },
    { label: "Acne", desc: "Breakout care" },
    { label: "Glow", desc: "Radiance boost" },
    { label: "Protection", desc: "SPF & defense" },
  ];

  return (
    <div style={{ backgroundColor: WARM.softWhite }} className="min-h-screen pb-24">

      <AnimatePresence>
        {showPaywall && (
          <PaywallModal
            onSubscribe={handleSubscribe}
            onClose={() => { setShowPaywall(false); setPaywallConcern(null); }}
            loading={checkoutLoading}
            concernContext={paywallConcern}
          />
        )}
      </AnimatePresence>

      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ backgroundColor: WARM.cream, borderBottomColor: WARM.beige }}
        className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40"
      >
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
          <h1 style={{ color: WARM.darkBrown }} className="font-bold text-xl tracking-tight">
            Skin<span style={{ color: WARM.tan }}>AI</span>
          </h1>
          <p style={{ color: WARM.tan }} className="text-xs">Your Personal Skin Advisor</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
          onClick={() => setView("profile")}
          style={{ backgroundColor: view === "profile" ? WARM.tan : WARM.beige }}
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors duration-200"
        >
          <span style={{ color: view === "profile" ? "#fff" : WARM.darkBrown }}>{getInitials()}</span>
        </motion.button>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 py-8 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* HOME VIEW */}
          {view === "home" && (
            <motion.div key="home" {...fadeUp} className="flex flex-col items-center gap-8">
              <motion.div variants={stagger} initial="initial" animate="animate" className="text-center">
                <motion.h2 variants={item} style={{ color: WARM.darkBrown }} className="text-4xl font-bold mb-3">
                  Discover What Your<br />Skin Needs Most
                </motion.h2>
                <motion.p variants={item} style={{ color: WARM.tan }} className="text-base max-w-md mx-auto">
                  AI-powered facial analysis tailored to your unique skin tone and concerns.
                </motion.p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                transition={{ duration: 0.2 }}
                style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                className="w-full max-w-md rounded-3xl border p-6 flex items-center justify-between shadow-sm cursor-pointer"
                onClick={() => { setActiveConcern(null); setView("scan"); }}
              >
                <div className="flex items-center gap-4">
                  <div style={{ backgroundColor: WARM.beige }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ color: WARM.darkBrown }} className="font-semibold">Scan your face with AI</p>
                    <p style={{ color: WARM.tan }} className="text-xs">Get your skin health report</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ backgroundColor: WARM.tan }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                >→</motion.button>
              </motion.div>

              {!isSubscribed && trialsRemaining !== null && trialsRemaining !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ backgroundColor: trialsRemaining === 0 ? "#FEF3C7" : WARM.cream, borderColor: trialsRemaining === 0 ? "#F59E0B" : WARM.beige }}
                  className="w-full max-w-md rounded-2xl border p-4 flex items-center justify-between"
                >
                  <div>
                    <p style={{ color: WARM.darkBrown }} className="text-sm font-semibold">
                      {trialsRemaining === 0 ? "Free trials used" : `${trialsRemaining ?? 2} free deep ${trialsRemaining === 1 ? "analysis" : "analyses"} remaining`}
                    </p>
                    <p style={{ color: WARM.tan }} className="text-xs mt-0.5">
                      {trialsRemaining === 0 ? "Subscribe for unlimited deep analysis" : "Deep Analysis ✦ is free to try"}
                    </p>
                  </div>
                  {trialsRemaining === 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setPaywallConcern(null); setShowPaywall(true); }}
                      style={{ backgroundColor: WARM.tan }}
                      className="px-4 py-2 rounded-full text-white text-xs font-semibold shadow-sm"
                    >Upgrade</motion.button>
                  )}
                </motion.div>
              )}

              {isSubscribed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ backgroundColor: WARM.cream, borderColor: WARM.sage }}
                  className="w-full max-w-md rounded-2xl border p-4 flex items-center gap-3"
                >
                  <span style={{ color: WARM.sage }} className="text-lg">✓</span>
                  <div>
                    <p style={{ color: WARM.darkBrown }} className="text-sm font-semibold">Premium Active</p>
                    <p style={{ color: WARM.tan }} className="text-xs">Unlimited deep analysis</p>
                  </div>
                </motion.div>
              )}

              {history.length > 0 && history[0].scores && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                  style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                  className="w-full max-w-md rounded-3xl border p-6 shadow-sm"
                >
                  <p style={{ color: WARM.tan }} className="text-xs mb-1">Your Skin Health</p>
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ color: WARM.darkBrown }} className="text-5xl font-bold mb-1"
                  >{history[0].scores.skin_health}%</motion.p>
                  <p style={{ color: WARM.tan }} className="text-xs mb-5">
                    Last scan — {new Date(history[0].created_at).toLocaleDateString()}
                  </p>
                  <div className="flex justify-around">
                    <ScoreRing value={history[0].scores.moisture} label="Moisture" color="#A8B89A" />
                    <ScoreRing value={history[0].scores.clarity} label="Clarity" color={WARM.tan} />
                    <ScoreRing value={history[0].scores.evenness} label="Evenness" color={WARM.brown} />
                  </div>
                </motion.div>
              )}

              <div className="w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <p style={{ color: WARM.darkBrown }} className="font-bold text-lg">Explore by Skin Concern</p>
                  {!isSubscribed && (
                    <span style={{ backgroundColor: WARM.tan }} className="text-white text-xs font-bold px-2.5 py-1 rounded-full">Premium</span>
                  )}
                </div>
                <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-2 gap-3">
                  {skinConcerns.map((concern) => (
                    <motion.div
                      key={concern.label} variants={item}
                      whileHover={{ scale: 1.03, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                      className="rounded-2xl border p-4 cursor-pointer transition-all relative overflow-hidden"
                      onClick={() => handleConcernClick(concern)}
                    >
                      {!isSubscribed && (
                        <div className="absolute top-2 right-2">
                          <span style={{ color: WARM.tan }} className="text-xs">🔒</span>
                        </div>
                      )}
                      <p style={{ color: WARM.darkBrown }} className="font-semibold text-sm mt-2">{concern.label}</p>
                      <p style={{ color: WARM.tan }} className="text-xs">{concern.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* SCAN / CAPTURE VIEW */}
          {view === "scan" && (
            <motion.div key="scan" {...fadeUp} className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 style={{ color: WARM.darkBrown }} className="text-2xl font-bold">
                  {activeConcern ? `${activeConcern} Scan` : "Skin Scan"}
                </h2>
                <p style={{ color: WARM.tan }} className="text-sm mt-1">
                  {activeConcern ? `Analysis will focus on ${activeConcern.toLowerCase()}` : "Position your face in the oval"}
                </p>
              </div>

              {activeConcern && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ backgroundColor: WARM.cream, borderColor: WARM.tan }}
                  className="w-full max-w-lg rounded-2xl border px-4 py-2.5 flex items-center justify-between"
                >
                  <p style={{ color: WARM.darkBrown }} className="text-xs font-medium">
                    Focus: <span style={{ color: WARM.tan }} className="font-bold">{activeConcern}</span>
                  </p>
                  <button onClick={() => setActiveConcern(null)} style={{ color: WARM.brown }} className="text-xs">Clear ✕</button>
                </motion.div>
              )}

              {!isSubscribed && trialsRemaining !== null && (
                <div
                  style={{ backgroundColor: trialsRemaining === 0 ? "#FEF3C7" : WARM.cream, borderColor: trialsRemaining === 0 ? "#F59E0B" : WARM.beige }}
                  className="w-full max-w-lg rounded-2xl border px-4 py-2.5 flex items-center justify-between"
                >
                  <p style={{ color: WARM.darkBrown }} className="text-xs font-medium">
                    {trialsRemaining === 0
                      ? "No free deep analyses left — subscribe to unlock"
                      : `${trialsRemaining} free deep ${trialsRemaining === 1 ? "analysis" : "analyses"} remaining`}
                  </p>
                  {trialsRemaining === 0 && (
                    <button onClick={() => { setPaywallConcern(null); setShowPaywall(true); }} style={{ color: WARM.tan }} className="text-xs font-semibold ml-2">
                      Upgrade →
                    </button>
                  )}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                className="w-full max-w-lg rounded-3xl border overflow-hidden shadow-md"
              >
                {/* Camera viewport — oval clip with mirrored video */}
                <div className="relative bg-stone-900 flex items-center justify-center" style={{ height: 340 }}>

                  {/* Oval clip container */}
                  <div style={{
                    width: 280,
                    height: 320,
                    borderRadius: "50%",
                    overflow: "hidden",
                    position: "relative",
                    border: `3px solid ${WARM.beige}`,
                    willChange: "transform",
                  }}>
                    {/* Mirrored video — CSS only, canvas capture stays unmirrored */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scaleX(-1)", // Mirror for natural selfie feel
                      }}
                    />
                  </div>

                  {/* Camera off placeholder */}
                  {!cameraOn && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                      style={{ backgroundColor: "#1C1208" }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                        style={{ backgroundColor: WARM.beige }}
                        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                      >📷</motion.div>
                      <p style={{ color: WARM.beige }} className="text-sm">Camera is off</p>
                    </motion.div>
                  )}

                  {/* Face guide overlay — shown when camera is on */}
                  {cameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <FaceGuideOverlay analyzing={analyzing} deepLoading={deepLoading} />
                    </div>
                  )}

                  {/* Analyzing spinner overlay */}
                  {(analyzing || deepLoading) && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                      style={{ backgroundColor: "rgba(28,18,8,0.75)" }}
                    >
                      <div className="relative flex items-center justify-center">
                        <motion.div animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                          style={{ borderColor: WARM.tan }} className="absolute w-16 h-16 rounded-full border-2" />
                        <motion.div animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
                          style={{ borderColor: WARM.tan }} className="absolute w-16 h-16 rounded-full border-2" />
                        <div style={{ borderColor: WARM.tan, borderTopColor: "transparent" }}
                          className="w-14 h-14 border-4 rounded-full animate-spin" />
                      </div>
                      <p style={{ color: WARM.beige }} className="text-sm font-medium">
                        {deepLoading ? "Running deep analysis..." : "Analyzing your skin..."}
                      </p>
                    </motion.div>
                  )}
                </div>

                <div style={{ backgroundColor: WARM.cream }} className="px-5 py-4 flex justify-center gap-3 flex-wrap">
                  {!cameraOn ? (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={startCamera} style={{ backgroundColor: WARM.tan }}
                      className="px-8 py-3 rounded-full text-white font-semibold text-sm shadow-md">
                      Start Camera
                    </motion.button>
                  ) : (
                    <>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={stopCamera} style={{ borderColor: WARM.beige, color: WARM.brown }}
                        className="px-5 py-2.5 rounded-full text-sm font-medium border">Stop</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={captureAndAnalyze} disabled={analyzing || deepLoading}
                        style={{ backgroundColor: WARM.tan }}
                        className="px-6 py-2.5 rounded-full text-white font-semibold text-sm shadow-md disabled:opacity-50">
                        {analyzing ? "Analyzing..." : "Analyze Skin"}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={runDeepAnalysis} disabled={analyzing || deepLoading}
                        style={{ backgroundColor: WARM.darkBrown }}
                        className="px-6 py-2.5 rounded-full text-white font-semibold text-sm shadow-md disabled:opacity-50">
                        {deepLoading ? "Analyzing..." : "Deep Analysis ✦"}
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm w-full max-w-lg">
                  {error}
                </motion.div>
              )}

              <AnimatePresence>
                {scores && (
                  <motion.div key="scores"
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                    className="w-full max-w-lg rounded-3xl border p-6 shadow-md">
                    <p style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-2">Skin Health Score</p>
                    <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      style={{ color: WARM.darkBrown }} className="text-5xl font-bold mb-1">
                      {scores.skin_health}%
                    </motion.p>
                    <p style={{ color: WARM.tan }} className="text-xs mb-6">Based on current analysis</p>
                    <div className="flex justify-around">
                      <ScoreRing value={scores.moisture} label="Moisture" color="#A8B89A" />
                      <ScoreRing value={scores.clarity} label="Clarity" color={WARM.tan} />
                      <ScoreRing value={scores.evenness} label="Evenness" color={WARM.brown} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {result && (
                  <motion.div key="result"
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                    className="w-full max-w-lg rounded-3xl border p-6 shadow-md">
                    <p style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-4">
                      {activeConcern ? `${activeConcern} Analysis` : "Analysis Report"}
                    </p>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{result}</ReactMarkdown>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ANALYSIS VIEW */}
          {view === "analysis" && (
            <motion.div key="analysis" {...fadeUp} className="flex flex-col items-center gap-6">
              <div className="text-center w-full max-w-lg">
                <h2 style={{ color: WARM.darkBrown }} className="text-2xl font-bold">Analysis Report</h2>
                <p style={{ color: WARM.tan }} className="text-sm mt-1">
                  {activeAnalysisTitle ? `Focused on: ${activeAnalysisTitle}` : "Your deep skin analysis results"}
                </p>
              </div>

              {savedDeepAnalysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                  className="w-full max-w-lg"
                >
                  <div style={{ backgroundColor: WARM.cream, borderColor: WARM.tan }}
                    className="rounded-3xl border-2 p-5 mb-4 shadow-md">
                    <div className="flex items-center gap-2 mb-1">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{ backgroundColor: WARM.tan }} className="px-3 py-1 rounded-full">
                        <span className="text-white text-xs font-bold tracking-wide">
                          {isSubscribed ? "PREMIUM" : "FREE TRIAL"}
                        </span>
                      </motion.div>
                      {savedDeepAnalysis.skin_assessment?.fitzpatrick && (
                        <p style={{ color: WARM.brown }} className="text-xs font-medium">
                          {savedDeepAnalysis.skin_assessment.fitzpatrick}
                        </p>
                      )}
                    </div>
                    <p style={{ color: WARM.darkBrown }} className="font-bold text-base">Deep Analysis Report</p>
                  </div>

                  <motion.div variants={stagger} initial="initial" animate="animate">
                    {deepSections.map((sec) => {
                      const sectionData = savedDeepAnalysis[sec.key];
                      if (!sectionData) return null;
                      return (
                        <AnalysisSection
                          key={sec.key}
                          title={sec.title}
                          summaryItems={sectionData.summary || []}
                          detailItems={sectionData.detail || []}
                        />
                      );
                    })}
                  </motion.div>

                  {savedDeepAnalysis.disclaimer && (
                    <p style={{ color: WARM.beige }} className="text-xs text-center mt-4 px-4">
                      {savedDeepAnalysis.disclaimer}
                    </p>
                  )}
                </motion.div>
              ) : (
                <AnalysisEmptyState onGoToCapture={() => setView("scan")} />
              )}
            </motion.div>
          )}

          {/* HISTORY VIEW */}
          {view === "history" && (
            <motion.div key="history" {...fadeUp} className="flex gap-6">
              <div className="w-72 shrink-0">
                <h2 style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-4">Past Scans</h2>
                {history.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ backgroundColor: WARM.cream, borderColor: WARM.beige, color: WARM.tan }}
                    className="rounded-2xl border p-6 text-center text-sm">
                    No scans yet. Run your first analysis.
                  </motion.div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="flex flex-col gap-3">
                    {history.map((report) => (
                      <motion.div key={report.id} variants={item}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedReport(report)}
                        style={{
                          backgroundColor: selectedReport?.id === report.id ? WARM.beige : WARM.cream,
                          borderColor: selectedReport?.id === report.id ? WARM.tan : WARM.beige,
                        }}
                        className="rounded-2xl border p-4 cursor-pointer transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ color: WARM.brown }} className="text-xs font-semibold">
                            Scan #{report.id.slice(0, 8)}...
                          </span>
                          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                            style={{ color: WARM.beige }} className="hover:text-red-400 transition-colors text-sm">✕</motion.button>
                        </div>
                        {report.scores && (
                          <p style={{ color: WARM.darkBrown }} className="text-2xl font-bold">
                            {report.scores.skin_health}%
                          </p>
                        )}
                        <p style={{ color: WARM.tan }} className="text-xs mt-1">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {selectedReport ? (
                    <motion.div key={selectedReport.id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                      className="rounded-3xl border p-6 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <p style={{ color: WARM.darkBrown }} className="font-bold text-lg">
                          Scan #{selectedReport.id.slice(0, 8)}...
                        </p>
                        <p style={{ color: WARM.tan }} className="text-xs">
                          {new Date(selectedReport.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedReport.scores && (
                        <div style={{ backgroundColor: WARM.beige }} className="rounded-2xl p-4 mb-5 flex justify-around">
                          <ScoreRing value={selectedReport.scores.moisture} label="Moisture" color="#A8B89A" />
                          <ScoreRing value={selectedReport.scores.clarity} label="Clarity" color={WARM.tan} />
                          <ScoreRing value={selectedReport.scores.evenness} label="Evenness" color={WARM.brown} />
                        </div>
                      )}
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                        {selectedReport.analysis}
                      </ReactMarkdown>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ backgroundColor: WARM.cream, borderColor: WARM.beige, color: WARM.tan }}
                      className="rounded-3xl border h-64 flex items-center justify-center text-sm">
                      Select a scan to view details
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* PROFILE VIEW */}
          {view === "profile" && (
            <motion.div key="profile" {...fadeUp} className="flex flex-col items-center gap-6 max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="flex flex-col items-center gap-3"
              >
                <div style={{ backgroundColor: WARM.tan }}
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-2xl">{getInitials()}</span>
                </div>
                {displayName
                  ? <p style={{ color: WARM.darkBrown }} className="font-bold text-lg">{displayName}</p>
                  : <p style={{ color: WARM.tan }} className="text-sm">Set your name</p>}
                <p style={{ color: WARM.brown }} className="text-xs">{userEmail}</p>
                {isSubscribed && (
                  <div style={{ backgroundColor: WARM.sage }} className="px-3 py-1 rounded-full">
                    <span className="text-white text-xs font-bold">PREMIUM</span>
                  </div>
                )}
              </motion.div>

              <motion.div variants={stagger} initial="initial" animate="animate"
                style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                className="w-full rounded-3xl border overflow-hidden shadow-sm">

                <motion.div variants={item} style={{ borderBottomColor: WARM.beige }} className="border-b px-6 py-4">
                  <p style={{ color: WARM.tan }} className="text-xs font-medium mb-1 uppercase tracking-wide">Display Name</p>
                  {editingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                        placeholder="Enter your name"
                        style={{ backgroundColor: WARM.softWhite, borderColor: WARM.beige, color: WARM.darkBrown }}
                        className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:border-amber-400" />
                      <motion.button whileTap={{ scale: 0.95 }} onClick={saveName}
                        style={{ backgroundColor: WARM.tan }} className="px-4 py-2 rounded-xl text-white text-sm font-medium">Save</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditingName(false)}
                        style={{ color: WARM.brown }} className="px-3 py-2 text-sm">Cancel</motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p style={{ color: WARM.darkBrown }} className="text-sm font-medium">{displayName || "Not set"}</p>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setTempName(displayName); setEditingName(true); }}
                        style={{ color: WARM.tan, borderColor: WARM.beige }}
                        className="text-xs font-medium border px-3 py-1 rounded-full">Edit</motion.button>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={item} style={{ borderBottomColor: WARM.beige }} className="border-b px-6 py-4">
                  <p style={{ color: WARM.tan }} className="text-xs font-medium mb-1 uppercase tracking-wide">Email</p>
                  <p style={{ color: WARM.darkBrown }} className="text-sm">{userEmail}</p>
                </motion.div>

                <motion.div variants={item} style={{ borderBottomColor: WARM.beige }} className="border-b px-6 py-4">
                  <p style={{ color: WARM.tan }} className="text-xs font-medium mb-1 uppercase tracking-wide">Plan</p>
                  <div className="flex items-center justify-between">
                    <p style={{ color: WARM.darkBrown }} className="text-sm font-medium">
                      {isSubscribed ? "Premium — $4.99/month" : `Free (${trialsRemaining ?? 0} deep ${trialsRemaining === 1 ? "analysis" : "analyses"} left)`}
                    </p>
                    {!isSubscribed && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setPaywallConcern(null); setShowPaywall(true); }}
                        style={{ backgroundColor: WARM.tan }}
                        className="text-xs font-semibold px-3 py-1 rounded-full text-white">Upgrade</motion.button>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={item} style={{ borderBottomColor: WARM.beige }} className="border-b px-6 py-4">
                  <p style={{ color: WARM.tan }} className="text-xs font-medium mb-1 uppercase tracking-wide">Total Scans</p>
                  <p style={{ color: WARM.darkBrown }} className="text-sm font-bold">{history.length}</p>
                </motion.div>

                <motion.div variants={item} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p style={{ color: WARM.tan }} className="text-xs font-medium uppercase tracking-wide">Notifications</p>
                    <p style={{ color: WARM.brown }} className="text-xs mt-0.5">Skin tips and reminders</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => setNotifications(!notifications)}
                    style={{ backgroundColor: notifications ? WARM.tan : WARM.beige }}
                    className="relative w-11 h-6 rounded-full transition-colors duration-200">
                    <motion.div animate={{ x: notifications ? 20 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </motion.button>
                </motion.div>
              </motion.div>

              <motion.button variants={item}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={async () => { await supabase.auth.signOut(); }}
                style={{ borderColor: "#FCA5A5", color: "#EF4444" }}
                className="w-full py-3.5 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-red-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <motion.nav
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        style={{ backgroundColor: WARM.cream, borderTopColor: WARM.beige }}
        className="fixed bottom-0 left-0 right-0 border-t z-50 px-2 py-2"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <motion.button key={id} onClick={() => setView(id)} whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 relative"
                style={{ minWidth: 64 }}>
                {active && (
                  <motion.div layoutId="nav-pill" style={{ backgroundColor: WARM.beige }}
                    className="absolute inset-0 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10"><Icon active={active} /></span>
                <span className="relative z-10 text-xs font-medium" style={{ color: active ? WARM.tan : WARM.brown }}>
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App;