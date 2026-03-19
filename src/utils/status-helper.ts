// src/utils/status-helper.ts

export const STATUS_REGISTRY = {
  request_status: {
    0: "Draft",
    1: "Awaiting HOD Approval",
    2: "Rejected HOD",
    3: "Awaiting HOD IT Approval",
    4: "Rejected HOD IT",
    5: "Completed",
    6: "Canceled",
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

// ← Pastikan function ini ada dan di-export
export function getStatusLabel(
  group: keyof typeof STATUS_REGISTRY,
  value?: number | null,
): string {
  if (value === null || value === undefined) return "-";
  return (STATUS_REGISTRY[group] as Record<number, string>)?.[value] ?? "-";
}
