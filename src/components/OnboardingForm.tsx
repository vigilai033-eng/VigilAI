"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type EmailProvider = "Gmail" | "Outlook" | "Custom" | "";
type TeamSize = "1-5" | "6-20" | "21-50" | "50+" | "";
type TechOption = "React" | "Node.js" | "Python" | "Django" | "WordPress" | "Other";

interface FormData {
  businessName: string;
  websiteUrl: string;
  emailProvider: EmailProvider;
  techStack: TechOption[];
  teamSize: TeamSize;
}

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
  emailProvider: "",
  techStack: [],
  teamSize: "",
};

function isValidUrl(val: string): boolean {
  try {
    new URL(val.startsWith("http") ? val : `https://${val}`);
    return true;
  } catch {
    return false;
  }
}

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [authUserId, setAuthUserId] = useState<string>("");
  const [authUserEmail, setAuthUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setAuthUserId(session.user.id);
        setAuthUserEmail(session.user.email || "");
      }
    });
  }, [router]);

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

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!authUserId) {
      setSubmitError("Authentication required.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const { error } = await supabase.from("subscribers").insert([
        {
          id: authUserId,
          business_name: form.businessName.trim(),
          website_url: form.websiteUrl.trim().startsWith("http")
            ? form.websiteUrl.trim()
            : `https://${form.websiteUrl.trim()}`,
          email: authUserEmail,
          email_provider: form.emailProvider,
          tech_stack: form.techStack,
          team_size: form.teamSize,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Supabase insert error:", err);
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
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

      <div className="progress-bar-track" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={5}>
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

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
            />
            {errors.businessName && (
              <span className="field-error" role="alert">⚠ {errors.businessName}</span>
            )}
          </div>
        </div>
      )}

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
            />
            {errors.websiteUrl && (
              <span className="field-error" role="alert">⚠ {errors.websiteUrl}</span>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={panelClass} key="step-2">
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
              >
                <option value="" disabled>Select your email provider…</option>
                {EMAIL_PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {errors.emailProvider && (
              <span className="field-error" role="alert">⚠ {errors.emailProvider}</span>
            )}
          </div>
        </div>
      )}

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
            <div className="tech-grid" role="group">
              {TECH_OPTIONS.map(({ value, icon }) => (
                <div className="tech-option" key={value}>
                  <input
                    type="checkbox"
                    id={`tech-${value}`}
                    checked={form.techStack.includes(value)}
                    onChange={() => toggleTech(value)}
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
              <span className="field-error" role="alert">⚠ {errors.techStack}</span>
            )}
          </div>
        </div>
      )}

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
              >
                <option value="" disabled>Select your team size…</option>
                {TEAM_SIZES.map((s) => (
                  <option key={s} value={s}>{s} people</option>
                ))}
              </select>
            </div>
            {errors.teamSize && (
              <span className="field-error" role="alert">⚠ {errors.teamSize}</span>
            )}
          </div>

          {submitError && (
            <div className="field-error" role="alert" style={{ marginBottom: "1rem", color: "#ef4444", fontWeight: 500, fontSize: "0.9rem" }}>
              {submitError}
            </div>
          )}
        </div>
      )}

      <div className="btn-row">
        {step > 0 ? (
          <button type="button" className="btn btn-ghost" onClick={goBack} disabled={submitting}>
            <span className="btn-icon">←</span> Back
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={goNext}>
            Continue <span className="btn-icon">→</span>
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Finish Onboarding"}
          </button>
        )}
      </div>
    </div>
  );
}
