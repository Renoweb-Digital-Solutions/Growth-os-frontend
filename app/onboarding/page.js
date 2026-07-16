import OnboardingWizard from "../../components/onboarding/OnboardingWizard";

// Reason: We need a dynamic onboarding experience that adapts based on user intent (B2B vs B2C).
// How: This page simply wraps the OnboardingWizard component which handles all multi-step logic.
export default function OnboardingPage() {
  return <OnboardingWizard />;
}

