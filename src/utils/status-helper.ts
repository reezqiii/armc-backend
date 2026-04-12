export const STATUS_REGISTRY = {
  request_status: {
    1: "Pending Dept Head Approval",
    2: "Rejected by Dept Head Approval",
    3: "Pending IT Head Approval",
    4: "Rejected by IT Head Approval",
    5: "Completed",
    0: "Canceled",
  },
} as const;

export function getStatusLabel(
  group: keyof typeof STATUS_REGISTRY,
  value?: number | null,
): string {
  if (value === null || value === undefined) return "-";

  const label = (STATUS_REGISTRY[group] as Record<number, string>)?.[value];

  return label ?? "-";
}
