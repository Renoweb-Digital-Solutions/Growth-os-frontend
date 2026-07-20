export const userProfile = {
  name: "Samar",
  email: "samar@growthos.io",
  phone: "+1 (555) 123-4567",
  jobTitle: "Founder & CEO",
  timezone: "UTC -05:00 Eastern Time",
};

export const teamMembers = [
  { id: 1, name: "Samar", email: "samar@growthos.io", role: "Admin", status: "Active", avatar: "S" },
  { id: 2, name: "Lusi", email: "lusi@growthos.io", role: "Editor", status: "Active", avatar: "L" },
  { id: 3, name: "Alex", email: "alex@growthos.io", role: "Viewer", status: "Invited", avatar: "A" },
];

export const paymentMethods = [
  { id: "pm1", brand: "Visa", last4: "4242", expiry: "12/26", isDefault: true },
  { id: "pm2", brand: "Mastercard", last4: "5555", expiry: "08/25", isDefault: false },
];

export const integrations = [
  { id: "int1", name: "Google Analytics", description: "Sync website traffic and conversion data.", status: "Connected", iconColor: "bg-yellow-500" },
  { id: "int2", name: "Meta Business Suite", description: "Import Facebook and Instagram ad metrics.", status: "Connect", iconColor: "bg-blue-600" },
  { id: "int3", name: "LinkedIn Ads", description: "Track B2B campaign performance.", status: "Connect", iconColor: "bg-blue-700" },
  { id: "int4", name: "Slack", description: "Receive notifications and ticket updates.", status: "Connected", iconColor: "bg-purple-600" },
  { id: "int5", name: "Zapier", description: "Automate workflows across 3000+ apps.", status: "Connect", iconColor: "bg-orange-500" },
];

export const activeSessions = [
  { id: "sess1", device: "MacBook Pro - Chrome", location: "New York, USA", lastActive: "Current session" },
  { id: "sess2", device: "iPhone 13 - Safari", location: "New York, USA", lastActive: "2 hours ago" },
];
