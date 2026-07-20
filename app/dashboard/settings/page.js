"use client";

import { useState } from "react";
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const renderContent = () => {
    switch (activeTab) {
      case "profile": return <ProfileForm />;
      case "billing": return <BillingPlanTab />;
      case "payments": return <PaymentMethodsTab />;
      case "team": return <TeamMembersTab />;
      case "notifications": return <NotificationsTab />;
      case "integrations": return <IntegrationsTab />;
      case "security": return <SecurityTab />;
      default: return null;
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account, team, and billing preferences"
      />

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 w-full min-w-0">
          {renderContent()}
        </div>
      </div>
    </>
  );
}
