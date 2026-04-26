import OnboardingForm from "@/components/OnboardingForm";

export default function Home() {
  return (
    <div className="page-wrapper">
      {/* Decorative backgrounds */}
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
        <div className="navbar-badge">Early Access</div>
      </nav>

      <main className="main" id="main-content">
        {/* Hero Section */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-eyebrow" role="status">
            <span className="hero-eyebrow-dot" aria-hidden="true" />
            Now in Early Access
          </div>

          <h1 className="hero-title" id="hero-title">
            AI-powered security<br />
            for <span className="accent">AI companies</span>
          </h1>

          <p className="hero-subtitle">
            Plug in your details, get protected in 10 minutes. No IT team needed.
          </p>

          <div className="trust-badges" aria-label="Trust indicators">
            <div className="trust-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Enterprise-grade protection
            </div>
            <div className="trust-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Setup in 10 minutes
            </div>
            <div className="trust-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              No IT team required
            </div>
          </div>
        </section>

        {/* Onboarding Form Card */}
        <section aria-label="Onboarding form" className="card">
          <OnboardingForm />
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        © {new Date().getFullYear()} VigilAI · All rights reserved · Built for the AI era
      </footer>
    </div>
  );
}
