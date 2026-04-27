"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Sign up user via Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user created.");

      // 2. Insert into subscribers table
      const { error: dbError } = await supabase.from("subscribers").insert([
        {
          id: authData.user.id,
          business_name: form.companyName,
          email: form.email,
          website_url: "",
          email_provider: "Custom",
          tech_stack: [],
          team_size: "1-5",
        },
      ]);

      if (dbError) throw dbError;

      // 3. Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ justifyContent: "center" }}>
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-radial" aria-hidden="true" />

      <main className="main" style={{ padding: "0 2rem" }}>
        <section className="card" style={{ maxWidth: "440px", width: "100%", margin: "0 auto", padding: "2.5rem 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className="navbar-logo" style={{ margin: "0 auto 1rem", width: "48px", height: "48px", fontSize: "1.2rem" }}>VA</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Create your account</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Get your stack protected in minutes.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <label className="field-label" htmlFor="companyName">Company Name</label>
              <input
                id="companyName"
                type="text"
                className="field-input"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>

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
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error && <div className="field-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-dim)" }}>
            Already have an account? <Link href="/login" style={{ color: "var(--green-500)", textDecoration: "none" }}>Log in</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
