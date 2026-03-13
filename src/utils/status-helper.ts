// src/utils/status-helper.ts

export const STATUS_REGISTRY = {
  request_status: {
    0: "Draft",
    1: "Awaiting HOD Approval",
    2: "Rejected HOD Approval",
    3: "Awaiting Lead IT Approval",
    4: "Rejected Lead IT Approval",
    5: "Awaiting IT Manager Approval",
    6: "Rejected IT Manager Approval",
    7: "Completed",
    8: "Returned",
  },

  admin_status: {
    0: "On Queue",
    1: "On Progress",
    2: "Completed",
  },

  type: {
    0: "Internal",
    1: "External",
  },
} as const;

export function getStatusLabel(
  group: keyof typeof STATUS_REGISTRY,
  value?: number | null,
): string {
  if (value === null || value === undefined) return "-";
  return STATUS_REGISTRY[group]?.[value] ?? "-";
}

