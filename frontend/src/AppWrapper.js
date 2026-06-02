import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import App from "./App";
import Auth from "./Auth";

function AppWrapper() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#FAF6EF" }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: "#DFC9A8", borderTopColor: "#B8924A" }} />
      </div>
    );
  }

  return session ? <App session={session} /> : <Auth />;
}

export default AppWrapper;