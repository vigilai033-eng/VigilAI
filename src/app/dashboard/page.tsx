"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (!session || authError) {
        router.push("/login");
        return;
      }

      // Fetch company name from subscribers table
      const { data: subscriber, error: dbError } = await supabase
        .from("subscribers")
        .select("business_name")
        .eq("id", session.user.id)
        .single();

      if (!dbError && subscriber) {
        setCompanyName(subscriber.business_name);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="bg-grid" aria-hidden="true" />
      
      {/* Navbar */}
      <nav className="navbar" role="navigation" aria-label="Dashboard navigation">
        <div className="navbar-brand">
          <div className="navbar-logo" aria-hidden="true">VA</div>
          <span className="navbar-name">
            Vigil<span>AI</span>
          </span>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", border: "1px solid var(--border)" }}>
          Logout
        </button>
      </nav>

      <main className="main" style={{ alignItems: "flex-start", width: "100%", maxWidth: "1000px" }}>
        <header style={{ marginBottom: "3rem", width: "100%" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Welcome back, <span style={{ color: "var(--green-400)" }}>{companyName || "Security Admin"}</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Here is your infrastructure status.</p>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", width: "100%" }}>
          {/* Security Score */}
          <section className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 2rem" }}>
            <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Security Score</h2>
            <div style={{ position: "relative", width: "150px", height: "150px", borderRadius: "50%", background: "conic-gradient(var(--green-500) 72%, var(--bg-secondary) 0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px var(--green-glow)" }}>
              <div style={{ width: "130px", height: "130px", borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: "2.8rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>72</span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-dim)", fontWeight: 600 }}>/ 100</span>
              </div>
            </div>
            <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "center" }}>Needs Improvement</p>
          </section>

          {/* Threat Cards */}
          <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>Active Alerts</h2>
            
            <div className="card" style={{ padding: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "center", borderLeft: "4px solid #ef4444" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🚨</div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Critical CVE detected in React</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Action required: Update react-scripts immediately.</p>
              </div>
            </div>

            <div className="card" style={{ padding: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "center", borderLeft: "4px solid #f59e0b" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🔓</div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Employee email found in data breach</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>1 account exposed. Forced password reset recommended.</p>
              </div>
            </div>

            <div className="card" style={{ padding: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "center", borderLeft: "4px solid var(--green-500)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--green-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🎣</div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Phishing simulation due this week</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Schedule your team's quarterly security training.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
