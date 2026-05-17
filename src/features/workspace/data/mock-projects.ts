import type { CatalogNode, Project, ProjectGroup } from "@/features/workspace/types";

export const projectGroups: ProjectGroup[] = [
  {
    id: "customer-ops",
    title: "Customer Ops",
    hint: "Flows that touch support, onboarding, and health signals.",
  },
  {
    id: "internal-systems",
    title: "Internal Systems",
    hint: "Back-office automations and engineering handoffs.",
  },
  {
    id: "experiments",
    title: "Experiments",
    hint: "Draft graphs before they become production workflows.",
  },
];

export const nodeCatalog: CatalogNode[] = [
  {
    id: "webhook-trigger",
    label: "Webhook Trigger",
    app: "HTTP",
    connector: "Inbound",
    description: "Starts a workflow when an external service posts an event.",
  },
  {
    id: "branch-condition",
    label: "Branch Condition",
    app: "Logic",
    connector: "Rules",
    description: "Routes execution by status, payload fields, or ownership.",
  },
  {
    id: "enrich-record",
    label: "Enrich Record",
    app: "CRM",
    connector: "Data",
    description: "Loads related account, contact, and workspace context.",
  },
  {
    id: "human-approval",
    label: "Human Approval",
    app: "Desk",
    connector: "Gate",
    description: "Pauses the run until a person reviews the proposed action.",
  },
  {
    id: "notify-channel",
    label: "Notify Channel",
    app: "Slack",
    connector: "Message",
    description: "Posts a structured update to the responsible team channel.",
  },
  {
    id: "write-back",
    label: "Write Back",
    app: "Database",
    connector: "Mutation",
    description: "Persists the final state and execution notes.",
  },
];

export const initialProjects: Project[] = [
  {
    id: "customer-onboarding",
    name: "Customer onboarding",
    groupId: "customer-ops",
    status: "running",
    progress: 68,
    owner: "Ops",
    updatedAt: "Today, 10:42",
    description:
      "Coordinates new workspace setup, account enrichment, and launch notifications.",
    trigger: "Webhook: customer.created",
    nodes: [
      {
        id: "onboarding-trigger",
        type: "workflowNode",
        position: { x: 0, y: 80 },
        data: {
          label: "Customer created",
          app: "HTTP",
          connector: "Inbound",
          description: "Receives a signed customer.created webhook.",
          status: "done",
        },
      },
      {
        id: "onboarding-enrich",
        type: "workflowNode",
        position: { x: 300, y: 20 },
        data: {
          label: "Enrich account",
          app: "CRM",
          connector: "Data",
          description: "Pulls workspace metadata and account ownership.",
          status: "running",
        },
      },
      {
        id: "onboarding-approval",
        type: "workflowNode",
        position: { x: 600, y: 130 },
        data: {
          label: "Launch approval",
          app: "Desk",
          connector: "Gate",
          description: "Asks the implementation lead to approve launch.",
          status: "waiting",
        },
      },
      {
        id: "onboarding-notify",
        type: "workflowNode",
        position: { x: 900, y: 50 },
        data: {
          label: "Notify launch room",
          app: "Slack",
          connector: "Message",
          description: "Posts a launch checklist to the project channel.",
          status: "queued",
        },
      },
    ],
    edges: [
      {
        id: "onboarding-trigger-enrich",
        source: "onboarding-trigger",
        target: "onboarding-enrich",
        animated: true,
        label: "payload",
      },
      {
        id: "onboarding-enrich-approval",
        source: "onboarding-enrich",
        target: "onboarding-approval",
        animated: true,
        label: "account ready",
      },
      {
        id: "onboarding-approval-notify",
        source: "onboarding-approval",
        target: "onboarding-notify",
        animated: true,
        label: "approved",
      },
    ],
  },
  {
    id: "support-triage",
    name: "Support triage",
    groupId: "customer-ops",
    status: "idle",
    progress: 34,
    owner: "CX",
    updatedAt: "Yesterday, 16:18",
    description:
      "Classifies incoming support tickets and escalates risky cases before SLA drift.",
    trigger: "Ticket created",
    nodes: [
      {
        id: "triage-ticket",
        type: "workflowNode",
        position: { x: 0, y: 40 },
        data: {
          label: "Ticket received",
          app: "Helpdesk",
          connector: "Trigger",
          description: "Starts when a new customer ticket enters the queue.",
          status: "queued",
        },
      },
      {
        id: "triage-risk",
        type: "workflowNode",
        position: { x: 300, y: 40 },
        data: {
          label: "Risk scoring",
          app: "AI Classifier",
          connector: "Analysis",
          description: "Scores account risk, sentiment, and SLA proximity.",
          status: "queued",
        },
      },
      {
        id: "triage-route",
        type: "workflowNode",
        position: { x: 600, y: 40 },
        data: {
          label: "Route owner",
          app: "Rules",
          connector: "Branch",
          description: "Assigns the ticket to the correct support pod.",
          status: "queued",
        },
      },
    ],
    edges: [
      {
        id: "triage-ticket-risk",
        source: "triage-ticket",
        target: "triage-risk",
        label: "ticket",
      },
      {
        id: "triage-risk-route",
        source: "triage-risk",
        target: "triage-route",
        label: "score",
      },
    ],
  },
  {
    id: "release-handoff",
    name: "Release handoff",
    groupId: "internal-systems",
    status: "blocked",
    progress: 52,
    owner: "Engineering",
    updatedAt: "Fri, 18:03",
    description:
      "Moves release notes, QA status, and deployment evidence through the launch path.",
    trigger: "Release candidate tagged",
    nodes: [
      {
        id: "handoff-tag",
        type: "workflowNode",
        position: { x: 0, y: 50 },
        data: {
          label: "RC tagged",
          app: "GitHub",
          connector: "Trigger",
          description: "Detects a release candidate tag.",
          status: "done",
        },
      },
      {
        id: "handoff-qa",
        type: "workflowNode",
        position: { x: 300, y: 50 },
        data: {
          label: "QA evidence",
          app: "TestRail",
          connector: "Check",
          description: "Collects missing QA evidence before deployment.",
          status: "failed",
        },
      },
      {
        id: "handoff-notes",
        type: "workflowNode",
        position: { x: 600, y: 50 },
        data: {
          label: "Publish notes",
          app: "Docs",
          connector: "Write",
          description: "Drafts the release note package.",
          status: "queued",
        },
      },
    ],
    edges: [
      {
        id: "handoff-tag-qa",
        source: "handoff-tag",
        target: "handoff-qa",
        animated: true,
        label: "candidate",
      },
      {
        id: "handoff-qa-notes",
        source: "handoff-qa",
        target: "handoff-notes",
        label: "requires fix",
      },
    ],
  },
  {
    id: "invoice-sync",
    name: "Invoice sync",
    groupId: "internal-systems",
    status: "idle",
    progress: 88,
    owner: "Finance",
    updatedAt: "Thu, 09:27",
    description:
      "Syncs paid invoices into the reporting warehouse and finance notifications.",
    trigger: "Invoice paid",
    nodes: [
      {
        id: "invoice-paid",
        type: "workflowNode",
        position: { x: 0, y: 50 },
        data: {
          label: "Invoice paid",
          app: "Stripe",
          connector: "Trigger",
          description: "Receives invoice.paid events.",
          status: "queued",
        },
      },
      {
        id: "invoice-write",
        type: "workflowNode",
        position: { x: 300, y: 50 },
        data: {
          label: "Warehouse sync",
          app: "Database",
          connector: "Mutation",
          description: "Writes normalized revenue fields.",
          status: "queued",
        },
      },
    ],
    edges: [
      {
        id: "invoice-paid-write",
        source: "invoice-paid",
        target: "invoice-write",
        label: "payment",
      },
    ],
  },
  {
    id: "ai-intake-draft",
    name: "AI intake draft",
    groupId: "experiments",
    status: "draft",
    progress: 12,
    owner: "Product",
    updatedAt: "Mon, 13:14",
    description:
      "Explores a prompt-first intake flow that turns requests into implementation tasks.",
    trigger: "Manual run",
    nodes: [
      {
        id: "intake-start",
        type: "workflowNode",
        position: { x: 0, y: 50 },
        data: {
          label: "Manual request",
          app: "Workbench",
          connector: "Input",
          description: "Captures a structured product request.",
          status: "queued",
        },
      },
      {
        id: "intake-split",
        type: "workflowNode",
        position: { x: 300, y: 50 },
        data: {
          label: "Split into tasks",
          app: "AI Planner",
          connector: "Transform",
          description: "Breaks the request into a reviewable task graph.",
          status: "queued",
        },
      },
    ],
    edges: [
      {
        id: "intake-start-split",
        source: "intake-start",
        target: "intake-split",
        label: "brief",
      },
    ],
  },
];
