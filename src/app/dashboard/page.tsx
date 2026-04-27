"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  
  // Data states
  const [score, setScore] = useState(100);
  const [threats, setThreats] = useState<any[]>([]);
  const [breaches, setBreaches] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (!session || authError) {
          router.push("/login");
          return;
        }

        // Fetch company name, email, tech stack from subscribers table
        const { data: subscriber, error: dbError } = await supabase
          .from("subscribers")
          .select("business_name, email, tech_stack")
          .eq("id", session.user.id)
          .single();

        if (dbError || !subscriber) {
          router.push("/onboarding");
          return;
        }

        setCompanyName(subscriber.business_name);

        // 1. Fetch breaches
        const breachesPromise = fetch("/api/breaches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: subscriber.email })
        }).then(res => res.json());

        // 2. Fetch threats via GET for each technology
        const techPromises = (subscriber.tech_stack || []).map((tech: string) => 
          fetch(`/api/threats?keyword=${encodeURIComponent(tech)}`).then(res => res.json())
        );

        // Await all parallel requests
        const [breachesData, ...techResults] = await Promise.all([breachesPromise, ...techPromises]);

        setBreaches(breachesData.count || 0);

        // Combine all threats
        let allThreats: any[] = [];
        techResults.forEach((res) => {
          if (res.threats) {
            allThreats = [...allThreats, ...res.threats];
          }
        });

        // Deduplicate and sort
        const uniqueThreats = Array.from(new Map(allThreats.map((t) => [t.id, t])).values());
        uniqueThreats.sort((a, b) => b.score - a.score);
        setThreats(uniqueThreats);

        // Calculate score
        let newScore = 100;
        uniqueThreats.forEach((t: any) => {
          if (t.severity === "CRITICAL") newScore -= 15;
          else if (t.severity === "HIGH") newScore -= 10;
        });
        
        if (breachesData.count > 0) {
          newScore -= 20;
        }

        // Floor at 0
        setScore(Math.max(0, newScore));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ justifyContent: "center" }}>
        <div className="spinner" style={{ width: "40px", height: "40px" }} />
      </div>
    );
  }

  // Helper for severity color mapping
  const getSeverityStyle = (severity: string) => {
    const s = severity?.toUpperCase();
    if (s === "CRITICAL" || s === "HIGH") return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", icon: "🚨" };
    if (s === "MEDIUM") return { color: "#f97316", bg: "rgba(249, 115, 22, 0.1)", icon: "⚠️" };
    return { color: "#eab308", bg: "rgba(234, 179, 8, 0.1)", icon: "🛡️" }; // LOW
  };

  // Score color
  const scoreColor = score >= 80 ? "var(--green-500)" : score >= 50 ? "#f97316" : "#ef4444";

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
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: "0.9rem", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>Dashboard</a>
          <a href="/settings" style={{ fontSize: "0.9rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}>Settings</a>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", border: "1px solid var(--border)" }}>
            Logout
          </button>
        </div>
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
          <section className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 2rem", height: "fit-content" }}>
            <h2 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Security Score</h2>
            <div style={{ position: "relative", width: "150px", height: "150px", borderRadius: "50%", background: `conic-gradient(${scoreColor} ${score}%, var(--bg-secondary) 0)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: score >= 80 ? "0 0 30px var(--green-glow)" : "none" }}>
              <div style={{ width: "130px", height: "130px", borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: "2.8rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-dim)", fontWeight: 600 }}>/ 100</span>
              </div>
            </div>
            <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "center", fontWeight: 600 }}>
              {score >= 80 ? "Excellent" : score >= 50 ? "Needs Improvement" : "Critical Risk"}
            </p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-dim)", textAlign: "center" }}>
              Last scanned: just now
            </p>
          </section>

          {/* Threat Cards */}
          <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>Active Alerts</h2>
            
            {threats.length === 0 && breaches === 0 && (
              <div className="card" style={{ padding: "2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                <div style={{ fontSize: "2rem" }}>✅</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--green-400)" }}>No threats found</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Your stack looks secure. We will keep monitoring.</p>
              </div>
            )}

            {breaches > 0 && (
              <div className="card" style={{ padding: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "center", borderLeft: "4px solid #ef4444" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🔓</div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Domain found in data breaches</h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{breaches} breach records found for your company's domain. Verify credentials.</p>
                </div>
              </div>
            )}

            {threats.map((threat) => {
              const style = getSeverityStyle(threat.severity);
              const descSnippet = threat.description?.length > 100 
                ? threat.description.substring(0, 100) + "..." 
                : threat.description;
                
              return (
                <div key={threat.id} className="card" style={{ padding: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "center", borderLeft: `4px solid ${style.color}` }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: style.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                    {style.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.25rem" }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "100px", background: style.bg, color: style.color }}>
                          {threat.severity}
                        </span>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{threat.id}</h3>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 500 }}>
                        Score: {threat.score} • {threat.publishedDate || threat.published}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "0.5rem" }}>
                      {descSnippet}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}
