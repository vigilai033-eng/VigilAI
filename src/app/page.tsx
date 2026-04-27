import Link from "next/link";

export const metadata = {
  title: "VigilAI | AI-powered security for AI companies",
  description: "Plug in your details, get protected in 10 minutes. No IT team needed.",
};

export default function Home() {
  return (
    <div className="page-wrapper">
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-radial" aria-hidden="true" />

      {/* Navbar */}
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <a href="/" className="navbar-brand" aria-label="VigilAI home">
          <div className="navbar-logo" aria-hidden="true">VA</div>
          <span className="navbar-name">
            Vigil<span>AI</span>
          </span>
        </a>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="navbar-badge">Early Access</div>
          <Link href="/login" className="btn btn-ghost" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", border: "1px solid var(--border)" }}>
            Login
          </Link>
        </div>
      </nav>

      <main className="main" id="main-content" style={{ justifyContent: "center", minHeight: "80vh" }}>
        {/* Hero Section */}
        <header className="hero">
          <h1 className="hero-title">
            AI-powered security<br />
            for <span className="text-highlight">AI companies</span>
          </h1>
          <p className="hero-subtitle">
            Plug in your details, get protected in 10 minutes. No IT team needed.
          </p>

          <div style={{ marginTop: "2.5rem" }}>
            <Link href="/signup" className="btn btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }}>
              Get Started <span className="btn-icon">→</span>
            </Link>
          </div>
          
          <div className="trust-badges" aria-label="Security guarantees" style={{ marginTop: "3rem" }}>
            <span className="trust-badge">
              <span className="trust-icon" aria-hidden="true">🛡️</span>
              Enterprise-grade protection
            </span>
            <span className="trust-badge">
              <span className="trust-icon" aria-hidden="true">⏱️</span>
              Setup in 10 minutes
            </span>
            <span className="trust-badge">
              <span className="trust-icon" aria-hidden="true">👨‍💻</span>
              No IT team required
            </span>
          </div>
        </header>
      </main>
    </div>
  );
}
