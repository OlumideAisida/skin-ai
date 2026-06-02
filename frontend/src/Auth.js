import { useState } from "react";
import { supabase } from "./supabase";

const WARM = {
  cream: "#F5EDE0",
  beige: "#DFC9A8",
  tan: "#B8924A",
  brown: "#7A5C2E",
  darkBrown: "#4A3520",
  softWhite: "#FAF6EF",
};

function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account.");
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: WARM.softWhite }}
      className="min-h-screen flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 style={{ color: WARM.darkBrown }}
          className="text-4xl font-bold tracking-tight">
          Skin<span style={{ color: WARM.tan }}>AI</span>
        </h1>
        <p style={{ color: WARM.tan }} className="text-sm mt-1">
          Your Personal Skin Advisor
        </p>
      </div>

      {/* Card */}
      <div style={{ backgroundColor: WARM.cream, borderColor: WARM.beige }}
        className="w-full max-w-sm rounded-3xl border p-8 shadow-lg">

        <h2 style={{ color: WARM.darkBrown }}
          className="text-2xl font-bold mb-1">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p style={{ color: WARM.tan }} className="text-sm mb-6">
          {mode === "login"
            ? "Sign in to access your skin reports"
            : "Start tracking your skin health"}
        </p>

        {/* Email */}
        <div className="mb-4">
          <label style={{ color: WARM.brown }}
            className="block text-xs font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            style={{
              backgroundColor: WARM.softWhite,
              borderColor: WARM.beige,
              color: WARM.darkBrown,
            }}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-amber-400"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label style={{ color: WARM.brown }}
            className="block text-xs font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              backgroundColor: WARM.softWhite,
              borderColor: WARM.beige,
              color: WARM.darkBrown,
            }}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-amber-400"
          />
        </div>

        {/* Error / Message */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ backgroundColor: WARM.tan }}
          className="w-full py-3 rounded-full text-white font-semibold text-sm shadow-md disabled:opacity-60"
        >
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"}
        </button>

        {/* Toggle */}
        <p style={{ color: WARM.brown }} className="text-center text-sm mt-5">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            style={{ color: WARM.tan }}
            className="font-semibold"
          >
            {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;