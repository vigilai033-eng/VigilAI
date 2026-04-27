"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ justifyContent: "center" }}>
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-radial" aria-hidden="true" />

      <main className="main" style={{ padding: "0 2rem" }}>
        <section className="card" style={{ maxWidth: "400px", width: "100%", margin: "0 auto", padding: "2.5rem 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="navbar-logo" style={{ margin: "0 auto 1rem", width: "48px", height: "48px", fontSize: "1.2rem" }}>VA</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Welcome back</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Log in to your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label" htmlFor="email">Work Email</label>
              <input
                id="email"
                type="email"
                className="field-input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="field-input"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error && <div className="field-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-dim)" }}>
            Don&rsquo;t have an account? <Link href="/signup" style={{ color: "var(--green-500)", textDecoration: "none" }}>Sign up</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
