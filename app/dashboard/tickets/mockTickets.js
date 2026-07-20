export const agents = {
  a1: { name: "Sarah J.", avatar: "S", role: "Support", color: "#6366F1" },
  a2: { name: "Mike T.", avatar: "M", role: "CXM", color: "#EC4899" },
  a3: { name: "Alex R.", avatar: "A", role: "Billing", color: "#10B981" },
};

export const mockTickets = [
  {
    id: "TKT-1042",
    subject: "Campaign not spending on Meta",
    type: "chat", // chat or ticket
    status: "Open", // Open, Pending, Resolved
    priority: "High",
    createdAt: "Today, 10:23 AM",
    assignee: "a1",
    relatedCampaign: "Summer Launch",
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "Hi, I noticed the Summer Launch campaign hasn't spent anything since yesterday. Can you check?",
        timestamp: "10:23 AM",
      },
      {
        id: "m2",
        sender: "agent",
        agentId: "a1",
        text: "Hi there! I'm looking into this right now. It seems Meta paused the ad set due to a policy flag. Let me appeal it for you.",
        timestamp: "10:28 AM",
      },
      {
        id: "m3",
        sender: "user",
        text: "Oh no! Is there anything I need to change in the creative?",
        timestamp: "10:30 AM",
      },
      {
        id: "m4",
        sender: "agent",
        agentId: "a1",
        text: "I don't think so, the creative looks fine. These automated flags happen sometimes. I'll update you as soon as they review it.",
        timestamp: "10:35 AM",
      }
    ],
  },
  {
    id: "TKT-1041",
    subject: "Analytics mismatch with Google Analytics",
    type: "ticket",
    status: "Pending",
    priority: "Medium",
    createdAt: "Yesterday, 3:15 PM",
    assignee: "a2",
    relatedCampaign: null,
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "The Growth OS dashboard shows 1,200 clicks for yesterday, but GA4 only shows 950. Why is there a discrepancy?",
        timestamp: "Yesterday, 3:15 PM",
      },
      {
        id: "m2",
        sender: "agent",
        agentId: "a2",
        text: "Hello! This is a common occurrence. Growth OS tracks all link clicks, whereas GA4 only tracks sessions where the page fully loaded and the script fired. Some users bounce before the page loads. We are investigating if there's any anomaly, but a 15-20% difference is standard.",
        timestamp: "Yesterday, 4:00 PM",
      },
    ],
  },
  {
    id: "TKT-1040",
    subject: "Invoice for June",
    type: "ticket",
    status: "Resolved",
    priority: "Low",
    createdAt: "May 29, 2026",
    assignee: "a3",
    relatedCampaign: null,
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "Can I get a PDF copy of my June invoice?",
        timestamp: "May 29, 9:00 AM",
      },
      {
        id: "m2",
        sender: "agent",
        agentId: "a3",
        text: "Absolutely. I've attached it to this message. You can also download future invoices from the Settings > Billing tab.",
        timestamp: "May 29, 10:15 AM",
      },
      {
        id: "m3",
        sender: "user",
        text: "Got it, thanks!",
        timestamp: "May 29, 10:20 AM",
      },
    ],
  },
  {
    id: "TKT-1039",
    subject: "Can we increase budget on LinkedIn?",
    type: "chat",
    status: "Open",
    priority: "Medium",
    createdAt: "Today, 1:45 PM",
    assignee: "a2",
    relatedCampaign: "Q3 Webinar",
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "The webinar is next week. Let's double the daily budget on LinkedIn.",
        timestamp: "1:45 PM",
      },
    ],
  },
  {
    id: "TKT-1038",
    subject: "Dashboard access for my team",
    type: "ticket",
    status: "Resolved",
    priority: "Low",
    createdAt: "May 25, 2026",
    assignee: "a1",
    relatedCampaign: null,
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "How do I invite my co-founder to see the dashboard?",
        timestamp: "May 25, 2:00 PM",
      },
      {
        id: "m2",
        sender: "agent",
        agentId: "a1",
        text: "Hi! You can go to Settings > Team Members and click 'Invite Member'. Let me know if you need any help with it.",
        timestamp: "May 25, 3:30 PM",
      }
    ],
  }
];
