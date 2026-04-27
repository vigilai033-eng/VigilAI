"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || error) {
        router.push("/login");
        return;
      }

      // Check if user already finished onboarding
      const { data: subscriber } = await supabase
        .from("subscribers")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (subscriber) {
        router.push("/dashboard");
        return;
      }

      setLoading(false);
    };

    checkAuthAndProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ justifyContent: "center" }}>
        <div className="spinner" style={{ width: "40px", height: "40px" }} />
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ justifyContent: "center", padding: "2rem" }}>
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-radial" aria-hidden="true" />
      
      <main className="main" style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
        <OnboardingForm />
      </main>
    </div>
  );
}
