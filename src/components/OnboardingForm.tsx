"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";

// ─── Types ────────────────────────────────────────────────
type EmailProvider = "Gmail" | "Outlook" | "Custom" | "";
type TeamSize = "1-5" | "6-20" | "21-50" | "50+" | "";
type TechOption = "React" | "Node.js" | "Python" | "Django" | "WordPress" | "Other";

interface FormData {
  businessName: string;
  websiteUrl: string;
  email: string;
  emailProvider: EmailProvider;
  techStack: TechOption[];
  teamSize: TeamSize;
}

// ─── Constants ────────────────────────────────────────────
const EMAIL_PROVIDERS: EmailProvider[] = ["Gmail", "Outlook", "Custom"];
const TEAM_SIZES: TeamSize[] = ["1-5", "6-20", "21-50", "50+"];

const TECH_OPTIONS: { value: TechOption; icon: string }[] = [
  { value: "React",     icon: "⚛️" },
  { value: "Node.js",   icon: "🟩" },
  { value: "Python",    icon: "🐍" },
  { value: "Django",    icon: "🎸" },
  { value: "WordPress", icon: "🌐" },
  { value: "Other",     icon: "🔧" },
];

const STEPS = [
  { label: "Step 1 of 5", title: "Your Business" },
  { label: "Step 2 of 5", title: "Your Website" },
  { label: "Step 3 of 5", title: "Email Provider" },
  { label: "Step 4 of 5", title: "Tech Stack" },
  { label: "Step 5 of 5", title: "Team Size" },
];

const INITIAL_FORM: FormData = {
  businessName: "",
  websiteUrl: "",
  email: "",
  emailProvider: "",
  techStack: [],
  teamSize: "",
};

// ─── Helpers ──────────────────────────────────────────────
function isValidUrl(val: string): boolean {
  try {
    new URL(val.startsWith("http") ? val : `https://${val}`);
    return true;
  } catch {
    return false;
  }
}

// ─── Component ────────────────────────────────────────────
export default function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Validation ─────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (step === 0) {
      if (!form.businessName.trim())
        errs.businessName = "Business name is required.";
      else if (form.businessName.trim().length < 2)
        errs.businessName = "Must be at least 2 characters.";
    }

    if (step === 1) {
      if (!form.websiteUrl.trim())
        errs.websiteUrl = "Website URL is required.";
      else if (!isValidUrl(form.websiteUrl))
        errs.websiteUrl = "Please enter a valid URL (e.g. https://yoursite.com).";
    }

    if (step === 2) {
      if (!form.email.trim()) {
        errs.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errs.email = "Please enter a valid email address.";
      }
      if (!form.emailProvider)
        errs.emailProvider = "Please select an email provider.";
    }

    if (step === 3) {
      if (form.techStack.length === 0)
        errs.techStack = "Select at least one technology.";
    }

    if (step === 4) {
      if (!form.teamSize)
        errs.teamSize = "Please select your team size.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [step, form]);

  // ── Navigation ─────────────────────────────────────────
  const goNext = () => {
    if (!validate()) return;
    setDirection("forward");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    setErrors({});
  };

  const goBack = () => {
    setDirection("back");
    setStep((s) => Math.max(s - 1, 0));
    setErrors({});
  };

  // ── Field handlers ─────────────────────────────────────
  const handleText = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSelect = (field: keyof FormData) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const toggleTech = (tech: TechOption) => {
    setForm((f) => ({
      ...f,
      techStack: f.techStack.includes(tech)
        ? f.techStack.filter((t) => t !== tech)
        : [...f.techStack, tech],
    }));
    if (errors.techStack) setErrors((e) => ({ ...e, techStack: undefined }));
  };

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const { error } = await supabase.from("subscribers").insert([
        {
          business_name: form.businessName.trim(),
          website_url: form.websiteUrl.trim().startsWith("http")
            ? form.websiteUrl.trim()
            : `https://${form.websiteUrl.trim()}`,
          email: form.email.trim(),
          email_provider: form.emailProvider,
          tech_stack: form.techStack,
          team_size: form.teamSize,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setSubmitted(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#4ade80', '#ffffff']
      });
    } catch (err: any) {
      console.error("Supabase insert error:", err);
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Progress ──────────────────────────────────────────
  const progress = ((step + 1) / STEPS.length) * 100;

  // ─── Success screen ────────────────────────────────────
  if (submitted) {
    return (
      <div className="success-screen" role="alert" aria-live="polite" style={{ minHeight: "60vh", justifyContent: "center" }}>
        <div className="success-icon-ring" style={{ marginBottom: "2rem" }}>
          <div className="success-icon-inner" aria-hidden="true" style={{ fontSize: "3rem", color: "#fff" }}>✓</div>
        </div>

        <h2 className="success-title">VigilAI is now watching your stack.</h2>
        <p className="success-message">
          Check your inbox in 10 minutes.
        </p>
      </div>
    );
  }
  // ─── Form panels ───────────────────────────────────────
  const panelClass = `step-panel${direction === "back" ? " step-panel-back" : ""}`;

  return (
    <div role="form" aria-label="VigilAI onboarding">
      {/* Header */}
      <div className="step-header">
        <div className="step-info">
          <span className="step-label">{STEPS[step].label}</span>
          <span className="step-title">{STEPS[step].title}</span>
        </div>
        <div className="step-dots" role="tablist" aria-label="Form progress">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              role="tab"
              aria-selected={i === step}
              aria-label={`${s.label}: ${s.title}`}
              className={`step-dot ${i === step ? "active" : i < step ? "done" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-track" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={5}>
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Step 1: Business name ──────────────────────── */}
      {step === 0 && (
        <div className={panelClass} key="step-0">
          <div className="field-group">
            <label className="field-label" htmlFor="business-name">
              <span className="field-icon" aria-hidden="true">🏢</span>
              Business Name
            </label>
            <input
              id="business-name"
              type="text"
              className="field-input"
              placeholder="Acme AI Inc."
              value={form.businessName}
              onChange={handleText("businessName")}
              onKeyDown={(e) => e.key === "Enter" && goNext()}
              autoFocus
              autoComplete="organization"
              aria-describedby={errors.businessName ? "business-name-error" : undefined}
              aria-invalid={!!errors.businessName}
            />
            {errors.businessName && (
              <span id="business-name-error" className="field-error" role="alert">
                ⚠ {errors.businessName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: Website URL ────────────────────────── */}
      {step === 1 && (
        <div className={panelClass} key="step-1">
          <div className="field-group">
            <label className="field-label" htmlFor="website-url">
              <span className="field-icon" aria-hidden="true">🌐</span>
              Website URL
            </label>
            <input
              id="website-url"
              type="url"
              className="field-input"
              placeholder="https://yourcompany.com"
              value={form.websiteUrl}
              onChange={handleText("websiteUrl")}
              onKeyDown={(e) => e.key === "Enter" && goNext()}
              autoFocus
              autoComplete="url"
              aria-describedby={errors.websiteUrl ? "website-url-error" : undefined}
              aria-invalid={!!errors.websiteUrl}
            />
            {errors.websiteUrl && (
              <span id="website-url-error" className="field-error" role="alert">
                ⚠ {errors.websiteUrl}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Email provider ─────────────────────── */}
      {step === 2 && (
        <div className={panelClass} key="step-2">
          <div className="field-group">
            <label className="field-label" htmlFor="email">
              <span className="field-icon" aria-hidden="true">✉️</span>
              Work Email
            </label>
            <input
              id="email"
              type="email"
              className="field-input"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleText("email")}
              onKeyDown={(e) => e.key === "Enter" && goNext()}
              autoFocus
              autoComplete="email"
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <span id="email-error" className="field-error" role="alert">
                ⚠ {errors.email}
              </span>
            )}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="email-provider">
              <span className="field-icon" aria-hidden="true">📧</span>
              Email Provider
            </label>
            <div className="select-wrapper">
              <select
                id="email-provider"
                className="field-select"
                value={form.emailProvider}
                onChange={handleSelect("emailProvider")}
                aria-describedby={errors.emailProvider ? "email-provider-error" : undefined}
                aria-invalid={!!errors.emailProvider}
              >
                <option value="" disabled>Select your email provider…</option>
                {EMAIL_PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {errors.emailProvider && (
              <span id="email-provider-error" className="field-error" role="alert">
                ⚠ {errors.emailProvider}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Tech stack ─────────────────────────── */}
      {step === 3 && (
        <div className={panelClass} key="step-3">
          <div className="field-group">
            <label className="field-label">
              <span className="field-icon" aria-hidden="true">⚙️</span>
              Tech Stack
              <span style={{ color: "var(--text-dim)", fontWeight: 400, marginLeft: "0.25rem" }}>
                (select all that apply)
              </span>
            </label>
            <div
              className="tech-grid"
              role="group"
              aria-label="Technology stack options"
              aria-describedby={errors.techStack ? "tech-stack-error" : undefined}
            >
              {TECH_OPTIONS.map(({ value, icon }) => (
                <div className="tech-option" key={value}>
                  <input
                    type="checkbox"
                    id={`tech-${value}`}
                    checked={form.techStack.includes(value)}
                    onChange={() => toggleTech(value)}
                    aria-label={value}
                  />
                  <label className="tech-label" htmlFor={`tech-${value}`}>
                    <span className="tech-check" aria-hidden="true">
                      {form.techStack.includes(value) ? "✓" : ""}
                    </span>
                    <span className="tech-icon" aria-hidden="true">{icon}</span>
                    {value}
                  </label>
                </div>
              ))}
            </div>
            {errors.techStack && (
              <span id="tech-stack-error" className="field-error" role="alert">
                ⚠ {errors.techStack}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Step 5: Team size ──────────────────────────── */}
      {step === 4 && (
        <div className={panelClass} key="step-4">
          <div className="field-group">
            <label className="field-label" htmlFor="team-size">
              <span className="field-icon" aria-hidden="true">👥</span>
              Team Size
            </label>
            <div className="select-wrapper">
              <select
                id="team-size"
                className="field-select"
                value={form.teamSize}
                onChange={handleSelect("teamSize")}
                autoFocus
                aria-describedby={errors.teamSize ? "team-size-error" : undefined}
                aria-invalid={!!errors.teamSize}
              >
                <option value="" disabled>Select your team size…</option>
                {TEAM_SIZES.map((s) => (
                  <option key={s} value={s}>{s} people</option>
                ))}
              </select>
            </div>
            {errors.teamSize && (
              <span id="team-size-error" className="field-error" role="alert">
                ⚠ {errors.teamSize}
              </span>
            )}
          </div>

          {/* Global submit error */}
          {submitError && (
            <div className="field-error" role="alert" style={{ marginBottom: "1rem", color: "#ef4444", fontWeight: 500, fontSize: "0.9rem" }}>
              {submitError}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="btn-row">
        {step > 0 ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={goBack}
            disabled={submitting}
            aria-label="Go to previous step"
          >
            <span className="btn-icon">←</span>
            Back
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            id={`next-step-${step}`}
            className="btn btn-primary"
            onClick={goNext}
            aria-label={`Continue to ${STEPS[step + 1].title}`}
          >
            Continue
            <span className="btn-icon">→</span>
          </button>
        ) : (
          <button
            type="button"
            id="submit-form"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            aria-label="Submit onboarding form"
          >
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Activating…
              </>
            ) : (
              <>
                Activate VigilAI
                <span className="btn-icon">🛡️</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
