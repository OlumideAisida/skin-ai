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

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const item = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function ScoreRing({ value, label, color }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-2"
    >
      <div style={{ width: 80, height: 80 }}>
        <CircularProgressbar
          value={value}
          text={`${value}%`}
          styles={buildStyles({
            textSize: "22px",
            pathColor: color,
            textColor: "#5C4008",
            trailColor: "#E8D5B7",
            strokeLinecap: "round",
          })}
        />
      </div>
      <span style={{ color: WARM.darkBrown }} className="text-xs font-medium text-center">
        {label}
      </span>
    </motion.div>
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
  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [deepLoading, setDeepLoading] = useState(false);

  const BACKEND = "https://skin-ai-production-d736.up.railway.app";

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

  useEffect(() => { fetchHistory(); }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, audio: false,
      });
      videoRef.current.srcObject = stream;
      setCameraOn(true);
      setError(null);
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
    setResult(null);
    setScores(null);
    setDeepAnalysis(null);
  };

  const captureFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !cameraOn) return;
    setError(null);
    setResult(null);
    setScores(null);
    setDeepAnalysis(null);
    setAnalyzing(true);
    const base64Image = captureFrame();
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();
      setResult(data.analysis);
      setScores(data.scores);
      fetchHistory();
    } catch (err) {
      setError("Failed to connect to backend. Make sure it is running.");
    } finally {
      setAnalyzing(false);
    }
  };

  const runDeepAnalysis = async () => {
    if (!videoRef.current || !cameraOn) return;
    setDeepLoading(true);
    setDeepAnalysis(null);
    const base64Image = captureFrame();
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND}/analyze/deep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();
      setDeepAnalysis(data.deep_analysis);
    } catch (err) {
      setError("Failed to run deep analysis.");
    } finally {
      setDeepLoading(false);
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
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto mt-3">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => <th style={{ color: WARM.brown, borderBottomColor: WARM.beige }} className="text-left font-semibold border-b pb-2 pr-4 py-2" {...props} />,
    td: ({ node, ...props }) => <td style={{ color: "#6B4F1A", borderBottomColor: WARM.beige }} className="border-b py-2 pr-4" {...props} />,
    hr: ({ node, ...props }) => <hr style={{ borderColor: WARM.beige }} className="my-4" {...props} />,
    p: ({ node, ...props }) => <p style={{ color: "#6B4F1A" }} className="leading-relaxed mb-2 text-sm" {...props} />,
  };

  return (
    <div style={{ backgroundColor: WARM.softWhite }} className="min-h-screen">

      {/* Nav */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ backgroundColor: WARM.cream, borderBottomColor: WARM.beige }}
        className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50"
      >
        <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
          <h1 style={{ color: WARM.darkBrown }} className="font-bold text-xl tracking-tight">
            Skin<span style={{ color: WARM.tan }}>AI</span>
          </h1>
          <p style={{ color: WARM.tan }} className="text-xs">Your Personal Skin Advisor</p>
        </motion.div>
        <div className="flex gap-2 items-center">
          {["home", "scan", "history"].map((v) => (
            <motion.button
              key={v}
              onClick={() => setView(v)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                backgroundColor: view === v ? WARM.tan : "transparent",
                color: view === v ? "#fff" : WARM.brown,
                borderColor: WARM.beige,
              }}
              className="px-4 py-2 rounded-full text-sm font-medium border capitalize transition-all duration-200"
            >
              {v === "home" ? "Home" : v === "scan" ? "Scan" : "History"}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => { await supabase.auth.signOut(); }}
            style={{ color: WARM.brown, borderColor: WARM.beige }}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 hover:border-red-300 hover:text-red-400"
          >
            Logout
          </motion.button>
        </div>
      </motion.nav>

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
                onClick={() => setView("scan")}
              >
                <div className="flex items-center gap-4">
                  <div style={{ backgroundColor: WARM.beige }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center">
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
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ backgroundColor: WARM.tan }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                >
                  →
                </motion.button>
              </motion.div>

              {history.length > 0 && history[0].scores && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                  className="w-full max-w-md rounded-3xl border p-6 shadow-sm"
                >
                  <p style={{ color: WARM.tan }} className="text-xs mb-1">Your Skin Health</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ color: WARM.darkBrown }}
                    className="text-5xl font-bold mb-1"
                  >
                    {history[0].scores.skin_health}%
                  </motion.p>
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
                <p style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-4">Explore by Skin Concern</p>
                <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Oiliness", desc: "T-zone control" },
                    { label: "Acne", desc: "Breakout care" },
                    { label: "Glow", desc: "Radiance boost" },
                    { label: "Protection", desc: "SPF & defense" },
                  ].map((concern) => (
                    <motion.div
                      key={concern.label}
                      variants={item}
                      whileHover={{ scale: 1.03, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                      whileTap={{ scale: 0.97 }}
                      style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                      className="rounded-2xl border p-4 cursor-pointer transition-all"
                      onClick={() => setView("scan")}
                    >
                      <p style={{ color: WARM.darkBrown }} className="font-semibold text-sm mt-2">{concern.label}</p>
                      <p style={{ color: WARM.tan }} className="text-xs">{concern.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* SCAN VIEW */}
          {view === "scan" && (
            <motion.div key="scan" {...fadeUp} className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 style={{ color: WARM.darkBrown }} className="text-2xl font-bold">Skin Scan</h2>
                <p style={{ color: WARM.tan }} className="text-sm mt-1">Position your face in good lighting</p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                className="w-full max-w-lg rounded-3xl border overflow-hidden shadow-md"
              >
                <div className="relative bg-stone-900">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
                  {!cameraOn && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                      style={{ backgroundColor: "#1C1208" }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{ backgroundColor: WARM.beige }}
                        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                      >
                        📷
                      </motion.div>
                      <p style={{ color: WARM.beige }} className="text-sm">Camera is off</p>
                    </motion.div>
                  )}
                  {(analyzing || deepLoading) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                      style={{ backgroundColor: "rgba(28,18,8,0.85)" }}
                    >
                      {/* Scanning pulse rings */}
                      <div className="relative flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                          style={{ borderColor: WARM.tan }}
                          className="absolute w-16 h-16 rounded-full border-2"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
                          style={{ borderColor: WARM.tan }}
                          className="absolute w-16 h-16 rounded-full border-2"
                        />
                        <div style={{ borderColor: WARM.tan, borderTopColor: "transparent" }}
                          className="w-14 h-14 border-4 rounded-full animate-spin" />
                      </div>
                      <p style={{ color: WARM.beige }} className="text-sm font-medium">
                        {deepLoading ? "Running deep analysis..." : "Analyzing your skin..."}
                      </p>
                    </motion.div>
                  )}
                </div>

                <div style={{ backgroundColor: WARM.cream }} className="px-5 py-4 flex justify-center gap-3">
                  {!cameraOn ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startCamera}
                      style={{ backgroundColor: WARM.tan }}
                      className="px-8 py-3 rounded-full text-white font-semibold text-sm shadow-md"
                    >
                      Start Camera
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={stopCamera}
                        style={{ borderColor: WARM.beige, color: WARM.brown }}
                        className="px-5 py-2.5 rounded-full text-sm font-medium border"
                      >
                        Stop
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={captureAndAnalyze}
                        disabled={analyzing || deepLoading}
                        style={{ backgroundColor: WARM.tan }}
                        className="px-6 py-2.5 rounded-full text-white font-semibold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {analyzing ? "Analyzing..." : "Analyze Skin"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={runDeepAnalysis}
                        disabled={analyzing || deepLoading}
                        style={{ backgroundColor: WARM.darkBrown }}
                        className="px-6 py-2.5 rounded-full text-white font-semibold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deepLoading ? "Analyzing..." : "Deep Analysis ✦"}
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm w-full max-w-lg"
                >
                  {error}
                </motion.div>
              )}

              <AnimatePresence>
                {scores && (
                  <motion.div
                    key="scores"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                    className="w-full max-w-lg rounded-3xl border p-6 shadow-md"
                  >
                    <p style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-2">Skin Health Score</p>
                    <motion.p
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      style={{ color: WARM.darkBrown }}
                      className="text-5xl font-bold mb-1"
                    >
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
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                    className="w-full max-w-lg rounded-3xl border p-6 shadow-md"
                  >
                    <p style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-4">Analysis Report</p>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {result}
                    </ReactMarkdown>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {deepAnalysis && (
                  <motion.div
                    key="deep"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    style={{ backgroundColor: WARM.cream, borderColor: WARM.tan }}
                    className="w-full max-w-lg rounded-3xl border-2 p-6 shadow-md"
                  >
                    <div className="flex items-center gap-2 mb-5">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{ backgroundColor: WARM.tan }}
                        className="px-3 py-1 rounded-full"
                      >
                        <span className="text-white text-xs font-bold tracking-wide">PREMIUM</span>
                      </motion.div>
                      <p style={{ color: WARM.darkBrown }} className="font-bold text-base">Deep Analysis Report</p>
                    </div>
                    <motion.div variants={stagger} initial="initial" animate="animate">
                      {deepAnalysis.split("##").filter(s => s.trim()).map((section, i) => {
                        const lines = section.trim().split("\n").filter(l => l.trim());
                        const title = lines[0].replace(/^\d+\.\s*/, "").trim();
                        const content = lines.slice(1);
                        return (
                          <motion.div
                            key={i}
                            variants={item}
                            style={{ backgroundColor: WARM.softWhite, borderColor: WARM.beige }}
                            className="rounded-2xl border p-4 mb-3"
                          >
                            <p style={{ color: WARM.brown }} className="font-semibold text-xs uppercase tracking-wider mb-2">
                              {title}
                            </p>
                            <div>
                              {content.map((line, j) => {
                                const clean = line.replace(/^[-*•]\s*/, "").replace(/\*\*/g, "").trim();
                                if (!clean) return null;
                                return (
                                  <div key={j} className="flex items-start gap-2 mb-1">
                                    <span style={{ color: WARM.tan }} className="mt-0.5 text-xs">▸</span>
                                    <p style={{ color: WARM.darkBrown }} className="text-xs leading-relaxed">{clean}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* HISTORY VIEW */}
          {view === "history" && (
            <motion.div key="history" {...fadeUp} className="flex gap-6">
              <div className="w-72 shrink-0">
                <h2 style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-4">Past Scans</h2>
                {history.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ backgroundColor: WARM.cream, borderColor: WARM.beige, color: WARM.tan }}
                    className="rounded-2xl border p-6 text-center text-sm"
                  >
                    No scans yet. Run your first analysis.
                  </motion.div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="flex flex-col gap-3">
                    {history.map((report) => (
                      <motion.div
                        key={report.id}
                        variants={item}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedReport(report)}
                        style={{
                          backgroundColor: selectedReport?.id === report.id ? WARM.beige : WARM.cream,
                          borderColor: selectedReport?.id === report.id ? WARM.tan : WARM.beige,
                        }}
                        className="rounded-2xl border p-4 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ color: WARM.brown }} className="text-xs font-semibold">
                            Scan #{report.id.slice(0, 8)}...
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                            style={{ color: WARM.beige }}
                            className="hover:text-red-400 transition-colors text-sm"
                          >✕</motion.button>
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
                    <motion.div
                      key={selectedReport.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                      className="rounded-3xl border p-6 shadow-md"
                    >
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
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ backgroundColor: WARM.cream, borderColor: WARM.beige, color: WARM.tan }}
                      className="rounded-3xl border h-64 flex items-center justify-center text-sm"
                    >
                      Select a scan to view details
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App;