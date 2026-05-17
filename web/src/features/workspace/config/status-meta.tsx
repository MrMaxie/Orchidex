import {
  IconAlertCircle,
  IconCircleCheck,
  IconCircleDashed,
  IconClockHour4,
  IconLoader2,
  IconPlayerPlay,
  type IconProps,
} from "@tabler/icons-react";
import type * as React from "react";

import type { WorkflowActivityStatus } from "@/features/workspace/contracts";
import type { NodeStatus } from "@/features/workspace/types";

type StatusIcon = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

export type StatusMeta = {
  label: string;
  action: string;
  icon: StatusIcon;
  className: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
};

export const projectStatusMeta: Record<WorkflowActivityStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    action: "Start run",
    icon: IconCircleDashed,
    className: "text-[color:var(--workflow-status-draft)]",
    badgeVariant: "outline",
  },
  idle: {
    label: "Ready",
    action: "Start run",
    icon: IconCircleCheck,
    className: "text-[color:var(--workflow-status-idle)]",
    badgeVariant: "secondary",
  },
  running: {
    label: "Running",
    action: "Stop run",
    icon: IconPlayerPlay,
    className: "text-[color:var(--workflow-status-running)]",
    badgeVariant: "default",
  },
  blocked: {
    label: "Blocked",
    action: "Resume run",
    icon: IconAlertCircle,
    className: "text-[color:var(--workflow-status-blocked)]",
    badgeVariant: "destructive",
  },
};

export const nodeStatusMeta: Record<NodeStatus, StatusMeta> = {
  idle: {
    label: "Idle",
    action: "Ready",
    icon: IconCircleDashed,
    className: "text-[color:var(--workflow-status-idle)]",
    badgeVariant: "outline",
  },
  queued: {
    label: "Queued",
    action: "Queue node",
    icon: IconClockHour4,
    className: "text-[color:var(--workflow-status-queued)]",
    badgeVariant: "outline",
  },
  running: {
    label: "Running",
    action: "Run node",
    icon: IconLoader2,
    className: "text-[color:var(--workflow-status-running)]",
    badgeVariant: "default",
  },
  waiting: {
    label: "Waiting",
    action: "Wait for input",
    icon: IconClockHour4,
    className: "text-[color:var(--workflow-status-waiting)]",
    badgeVariant: "secondary",
  },
  done: {
    label: "Done",
    action: "Complete node",
    icon: IconCircleCheck,
    className: "text-[color:var(--workflow-status-done)]",
    badgeVariant: "secondary",
  },
  failed: {
    label: "Failed",
    action: "Review failure",
    icon: IconAlertCircle,
    className: "text-[color:var(--workflow-status-failed)]",
    badgeVariant: "destructive",
  },
  blocked: {
    label: "Blocked",
    action: "Review block",
    icon: IconAlertCircle,
    className: "text-[color:var(--workflow-status-blocked)]",
    badgeVariant: "destructive",
  },
};
