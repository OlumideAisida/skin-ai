import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const WARM = {
  cream: "#2C2C2C",
  beige: "#DFC9A8",
  tan: "#B8924A",
  brown: "#C9A96E",
  darkBrown: "#F0E6D3",
  sage: "#8FA882",
  softWhite: "#1E1E1E",
};

function ScoreRing({ value, label, color }) {
  return (
    <div className="flex flex-col items-center gap-2">
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
    </div>
  );
}

function App() {
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

  const fetchHistory = async () => {
    try {
      const res = await fetch("https://skin-ai-production-d736.up.railway.app/history");
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
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !cameraOn) return;
    setError(null);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
    setAnalyzing(true);
    setResult(null);
    setScores(null);
    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const deleteReport = async (id) => {
    await fetch(`http://localhost:8000/history/${id}`, { method: "DELETE" });
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
    th: ({ node, ...props }) => (
      <th style={{ color: WARM.brown, borderBottomColor: WARM.beige }}
        className="text-left font-semibold border-b pb-2 pr-4 py-2" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td style={{ color: "#6B4F1A", borderBottomColor: WARM.beige }}
        className="border-b py-2 pr-4" {...props} />
    ),
    hr: ({ node, ...props }) => <hr style={{ borderColor: WARM.beige }} className="my-4" {...props} />,
    p: ({ node, ...props }) => <p style={{ color: "#6B4F1A" }} className="leading-relaxed mb-2 text-sm" {...props} />,
  };

  return (
    <div style={{ backgroundColor: "#1E1E1E" }} className="min-h-screen">

      {/* Nav */}
      <nav style={{ backgroundColor: "#2C2C2C", borderBottomColor: WARM.beige }}
  className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 style={{ color: WARM.darkBrown }} className="font-bold text-xl tracking-tight">
            Skin<span style={{ color: WARM.tan }}>AI</span>
          </h1>
          <p style={{ color: WARM.tan }} className="text-xs">Your Personal Skin Advisor</p>
        </div>
        <div className="flex gap-2">
          {["home", "scan", "history"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                backgroundColor: view === v ? WARM.tan : "transparent",
                color: view === v ? "#fff" : WARM.brown,
                borderColor: WARM.beige,
              }}
              className="px-4 py-2 rounded-full text-sm font-medium border capitalize transition-all duration-200"
            >
              {v === "home" ? " Home" : v === "scan" ? " Scan" : " History"}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── HOME VIEW ── */}
        {view === "home" && (
          <div className="flex flex-col items-center gap-8">

            {/* Hero */}
            <div className="text-center">
              <h2 style={{ color: WARM.darkBrown }} className="text-4xl font-bold mb-3">
                Discover What Your<br />Skin Needs Most
              </h2>
              <p style={{ color: WARM.tan }} className="text-base max-w-md mx-auto">
                AI-powered facial analysis tailored to your unique skin tone and concerns.
              </p>
            </div>

            {/* CTA Card */}
            <div
              style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
              className="w-full max-w-md rounded-3xl border p-6 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div style={{ backgroundColor: WARM.beige }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
                </div>
                <div>
                  <p style={{ color: WARM.darkBrown }} className="font-semibold">Scan your face with AI</p>
                  <p style={{ color: WARM.tan }} className="text-xs">Get your skin health report</p>
                </div>
              </div>
              <button
                onClick={() => setView("scan")}
                style={{ backgroundColor: WARM.tan }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
              >
                →
              </button>
            </div>

            {/* Last Scan Summary */}
            {history.length > 0 && history[0].scores && (
              <div style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                className="w-full max-w-md rounded-3xl border p-6 shadow-sm">
                <p style={{ color: WARM.tan }} className="text-xs mb-1">Your Skin Health</p>
                <p style={{ color: WARM.darkBrown }} className="text-5xl font-bold mb-1">
                  {history[0].scores.skin_health}%
                </p>
                <p style={{ color: WARM.tan }} className="text-xs mb-5">
                  Last scan — {history[0].created_at}
                </p>
                <div className="flex justify-around">
                  <ScoreRing value={history[0].scores.moisture} label="Moisture" color="#A8B89A" />
                  <ScoreRing value={history[0].scores.clarity} label="Clarity" color={WARM.tan} />
                  <ScoreRing value={history[0].scores.evenness} label="Evenness" color={WARM.brown} />
                </div>
              </div>
            )}

            {/* Skin Concerns */}
            <div className="w-full max-w-md">
              <p style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-4">
                Explore by Skin Concern
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "💧", label: "Oiliness", desc: "T-zone control" },
                  { icon: "🌿", label: "Acne", desc: "Breakout care" },
                  { icon: "✨", label: "Glow", desc: "Radiance boost" },
                  { icon: "🛡️", label: "Protection", desc: "SPF & defense" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                    className="rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setView("scan")}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <p style={{ color: WARM.darkBrown }} className="font-semibold text-sm mt-2">{item.label}</p>
                    <p style={{ color: WARM.tan }} className="text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── SCAN VIEW ── */}
        {view === "scan" && (
          <div className="flex flex-col items-center gap-6">

            <div className="text-center">
              <h2 style={{ color: WARM.darkBrown }} className="text-2xl font-bold">Skin Scan</h2>
              <p style={{ color: WARM.tan }} className="text-sm mt-1">Position your face in good lighting</p>
            </div>

            {/* Camera Card */}
            <div style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
              className="w-full max-w-lg rounded-3xl border overflow-hidden shadow-md">
              <div className="relative bg-stone-900">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
                {!cameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    style={{ backgroundColor: "#1C1208" }}>
                    <div style={{ backgroundColor: WARM.beige }}
                      className="w-20 h-20 rounded-full flex items-center justify-center text-4xl">
                      📷
                    </div>
                    <p style={{ color: WARM.beige }} className="text-sm">Camera is off</p>
                  </div>
                )}
                {analyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                    style={{ backgroundColor: "rgba(28,18,8,0.85)" }}>
                    <div style={{ borderColor: WARM.tan, borderTopColor: "transparent" }}
                      className="w-14 h-14 border-4 rounded-full animate-spin" />
                    <p style={{ color: WARM.beige }} className="text-sm font-medium">Analyzing your skin...</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div style={{ backgroundColor: WARM.cream }} className="px-5 py-4 flex justify-center gap-3">
                {!cameraOn ? (
                  <button onClick={startCamera}
                    style={{ backgroundColor: WARM.tan }}
                    className="px-8 py-3 rounded-full text-white font-semibold text-sm shadow-md">
                    Start Camera
                  </button>
                ) : (
                  <>
                    <button onClick={stopCamera}
                      style={{ borderColor: WARM.beige, color: WARM.brown }}
                      className="px-6 py-3 rounded-full text-sm font-medium border">
                      Stop
                    </button>
                    <button onClick={captureAndAnalyze} disabled={analyzing}
                      style={{ backgroundColor: analyzing ? WARM.beige : WARM.tan }}
                      className="px-8 py-3 rounded-full text-white font-semibold text-sm shadow-md disabled:cursor-not-allowed">
                      {analyzing ? "Analyzing..." : "Analyze Skin"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm w-full max-w-lg">
                ⚠️ {error}
              </div>
            )}

            {/* Scores */}
            {scores && (
              <div style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                className="w-full max-w-lg rounded-3xl border p-6 shadow-md">
                <p style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-2">Skin Health Score</p>
                <p style={{ color: WARM.darkBrown }} className="text-5xl font-bold mb-1">{scores.skin_health}%</p>
                <p style={{ color: WARM.tan }} className="text-xs mb-6">Based on current analysis</p>
                <div className="flex justify-around">
                  <ScoreRing value={scores.moisture} label="Moisture" color="#A8B89A" />
                  <ScoreRing value={scores.clarity} label="Clarity" color={WARM.tan} />
                  <ScoreRing value={scores.evenness} label="Evenness" color={WARM.brown} />
                </div>
              </div>
            )}

            {/* Report */}
            {result && (
              <div style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                className="w-full max-w-lg rounded-3xl border p-6 shadow-md">
                <p style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-4">
                  Full Analysis Report
                </p>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {result}
                </ReactMarkdown>
              </div>
            )}

          </div>
        )}

        {/* ── HISTORY VIEW ── */}
        {view === "history" && (
          <div className="flex gap-6">
            <div className="w-72 shrink-0">
              <h2 style={{ color: WARM.darkBrown }} className="font-bold text-lg mb-4">Past Scans</h2>
              {history.length === 0 ? (
                <div style={{ backgroundColor: WARM.cream, borderColor: WARM.beige, color: WARM.tan }}
                  className="rounded-2xl border p-6 text-center text-sm">
                  No scans yet. Run your first analysis.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((report) => (
                    <div key={report.id} onClick={() => setSelectedReport(report)}
                      style={{
                        backgroundColor: selectedReport?.id === report.id ? WARM.beige : WARM.cream,
                        borderColor: selectedReport?.id === report.id ? WARM.tan : WARM.beige,
                      }}
                      className="rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ color: WARM.brown }} className="text-xs font-semibold">
                          Scan #{report.id}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                          style={{ color: WARM.beige }}
                          className="hover:text-red-400 transition-colors text-sm">✕</button>
                      </div>
                      {report.scores && (
                        <p style={{ color: WARM.darkBrown }} className="text-2xl font-bold">
                          {report.scores.skin_health}%
                        </p>
                      )}
                      <p style={{ color: WARM.tan }} className="text-xs mt-1">🕐 {report.created_at}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail */}
            <div className="flex-1">
              {selectedReport ? (
                <div style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
                  className="rounded-3xl border p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <p style={{ color: WARM.darkBrown }} className="font-bold text-lg">
                      Scan #{selectedReport.id}
                    </p>
                    <p style={{ color: WARM.tan }} className="text-xs">🕐 {selectedReport.created_at}</p>
                  </div>
                  {selectedReport.scores && (
                    <div style={{ backgroundColor: WARM.beige }}
                      className="rounded-2xl p-4 mb-5 flex justify-around">
                      <ScoreRing value={selectedReport.scores.moisture} label="Moisture" color="#A8B89A" />
                      <ScoreRing value={selectedReport.scores.clarity} label="Clarity" color={WARM.tan} />
                      <ScoreRing value={selectedReport.scores.evenness} label="Evenness" color={WARM.brown} />
                    </div>
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {selectedReport.analysis}
                  </ReactMarkdown>
                </div>
              ) : (
                <div style={{ backgroundColor: WARM.cream, borderColor: WARM.beige, color: WARM.tan }}
                  className="rounded-3xl border h-64 flex items-center justify-center text-sm">
                  Select a scan to view details
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App;