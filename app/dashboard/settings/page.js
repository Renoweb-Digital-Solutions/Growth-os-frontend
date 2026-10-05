"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/dashboard/PageHeader";
import SettingsTabs from "@/components/dashboard/settings/SettingsTabs";

// Tabs
import ProfileForm from "@/components/dashboard/settings/ProfileForm";
import BillingPlanTab from "@/components/dashboard/settings/BillingPlanTab";
import PaymentMethodsTab from "@/components/dashboard/settings/PaymentMethodsTab";
import TeamMembersTab from "@/components/dashboard/settings/TeamMembersTab";
import NotificationsTab from "@/components/dashboard/settings/NotificationsTab";
import IntegrationsTab from "@/components/dashboard/settings/IntegrationsTab";
import SecurityTab from "@/components/dashboard/settings/SecurityTab";

const validTabs = ["profile", "billing", "payments", "team", "notifications", "integrations", "security"];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState(null);

  const activeTab = selectedTab || (tabParam && validTabs.includes(tabParam) ? tabParam : "profile");

  const handleTabChange = (tabId) => {
    setSelectedTab(tabId);
    router.push(`/dashboard/settings?tab=${tabId}`, { scroll: false });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile": return <ProfileForm />;
      case "billing": return <BillingPlanTab />;
      case "payments": return <PaymentMethodsTab />;
      case "team": return <TeamMembersTab />;
      case "notifications": return <NotificationsTab />;
      case "integrations": return <IntegrationsTab />;
      case "security": return <SecurityTab />;
      default: return <ProfileForm />;
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, team, and billing preferences"
      />

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        <SettingsTabs activeTab={activeTab} setActiveTab={handleTabChange} />
        
        <div className="flex-1 w-full min-w-0">
          {renderContent()}
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

