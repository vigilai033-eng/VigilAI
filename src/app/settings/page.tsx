"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [companyName, setCompanyName] = useState("");
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [notifyWeekly, setNotifyWeekly] = useState(true);
  const [notifyBreaches, setNotifyBreaches] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (!session || authError) {
        router.push("/login");
        return;
      }
      setUser(session.user);

      const { data: subscriber, error: dbError } = await supabase
        .from("subscribers")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (dbError || !subscriber) {
        router.push("/onboarding");
        return;
      }

      setCompanyName(subscriber.business_name || "");
      setTeamEmails(subscriber.team_emails || []);
      setNotifyWeekly(subscriber.notify_weekly !== false);
      setNotifyBreaches(subscriber.notify_breaches !== false);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setSaving(true);
    await supabase.from("subscribers").update({ business_name: companyName }).eq("id", user.id);
    setSaving(false);
    alert("Company name saved!");
  };

  const addTeamEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) return;
    const updated = [...teamEmails, newEmail.trim()];
    setTeamEmails(updated);
    setNewEmail("");
    await supabase.from("subscribers").update({ team_emails: updated }).eq("id", user.id);
  };

  const removeTeamEmail = async (email: string) => {
    const updated = teamEmails.filter(e => e !== email);
    setTeamEmails(updated);
    await supabase.from("subscribers").update({ team_emails: updated }).eq("id", user.id);
  };

  const toggleNotifyWeekly = async () => {
    const nextVal = !notifyWeekly;
    setNotifyWeekly(nextVal);
    await supabase.from("subscribers").update({ notify_weekly: nextVal }).eq("id", user.id);
  };

  const toggleNotifyBreaches = async () => {
    const nextVal = !notifyBreaches;
    setNotifyBreaches(nextVal);
    await supabase.from("subscribers").update({ notify_breaches: nextVal }).eq("id", user.id);
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) setPasswordMsg(error.message);
    else {
      setPasswordMsg("Password updated successfully.");
      setNewPassword("");
    }
  };

  const deleteAccount = async () => {
    if (!confirm("WARNING: Are you sure you want to permanently delete your VigilAI account? This cannot be undone.")) return;
    
    // 1. Delete from subscribers table
    await supabase.from("subscribers").delete().eq("id", user.id);
    
    // 2. Try to delete from Auth (Requires RPC 'delete_user' to be set up in Supabase SQL)
    // CREATE OR REPLACE FUNCTION delete_user() RETURNS void AS $$ BEGIN DELETE FROM auth.users WHERE id = auth.uid(); END; $$ LANGUAGE plpgsql SECURITY DEFINER;
    await supabase.rpc('delete_user');
    
    // 3. Sign out and redirect
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ justifyContent: "center" }}>
        <div className="spinner" style={{ width: "40px", height: "40px" }} />
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
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: "0.9rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 500 }}>Dashboard</a>
          <a href="/settings" style={{ fontSize: "0.9rem", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>Settings</a>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", border: "1px solid var(--border)" }}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main" style={{ alignItems: "flex-start", width: "100%", maxWidth: "800px", gap: "2rem" }}>
        <header style={{ marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Settings</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Manage your account and preferences.</p>
        </header>

        {/* Section 1: Company */}
        <section className="card" style={{ width: "100%", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Company Profile</h2>
          <form onSubmit={saveCompany} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div className="field-group" style={{ flex: 1, margin: 0 }}>
              <label className="field-label">Company Name</label>
              <input 
                className="field-input" 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>Save</button>
          </form>
        </section>

        {/* Section 2: Team */}
        <section className="card" style={{ width: "100%", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Team Members</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
            {teamEmails.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No team members added yet.</p>}
            {teamEmails.map(email => (
              <div key={email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.95rem" }}>{email}</span>
                <button onClick={() => removeTeamEmail(email)} className="btn btn-ghost" style={{ padding: "0.3rem 0.6rem", color: "#ef4444" }}>Remove</button>
              </div>
            ))}
          </div>
          <form onSubmit={addTeamEmail} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div className="field-group" style={{ flex: 1, margin: 0 }}>
              <label className="field-label">Invite member (Email)</label>
              <input 
                type="email" 
                className="field-input" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)} 
                placeholder="colleague@company.com" 
              />
            </div>
            <button type="submit" className="btn btn-ghost" style={{ border: "1px solid var(--border)" }}>Add</button>
          </form>
        </section>

        {/* Section 3: Notifications */}
        <section className="card" style={{ width: "100%", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Notifications</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
              <input type="checkbox" checked={notifyWeekly} onChange={toggleNotifyWeekly} style={{ width: "18px", height: "18px", accentColor: "var(--green-500)" }} />
              <div>
                <div style={{ fontWeight: 600 }}>Weekly Security Digest</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Receive a summary of your stack's health every Monday.</div>
              </div>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
              <input type="checkbox" checked={notifyBreaches} onChange={toggleNotifyBreaches} style={{ width: "18px", height: "18px", accentColor: "var(--green-500)" }} />
              <div>
                <div style={{ fontWeight: 600 }}>Immediate Breach Alerts</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Get notified instantly if an employee email is compromised.</div>
              </div>
            </label>
          </div>
        </section>

        {/* Section 4: Security */}
        <section className="card" style={{ width: "100%", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Security</h2>
          <form onSubmit={updatePassword} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div className="field-group" style={{ flex: 1, margin: 0 }}>
              <label className="field-label">New Password</label>
              <input 
                type="password" 
                className="field-input" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                minLength={6}
                placeholder="Enter new password"
              />
            </div>
            <button type="submit" className="btn btn-ghost" style={{ border: "1px solid var(--border)" }} disabled={saving}>Update</button>
          </form>
          {passwordMsg && <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: passwordMsg.includes("success") ? "var(--green-500)" : "#ef4444" }}>{passwordMsg}</p>}
        </section>

        {/* Section 5: Danger Zone */}
        <section className="card" style={{ width: "100%", padding: "2rem", border: "1px solid #7f1d1d" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ef4444" }}>Danger Zone</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Permanently delete your account and all associated data. This action is irreversible.
          </p>
          <button onClick={deleteAccount} className="btn" style={{ background: "#ef4444", color: "#fff", fontWeight: 600, padding: "0.8rem 1.5rem", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            Delete Account
          </button>
        </section>
      </main>
    </div>
  );
}
