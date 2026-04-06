// src/utils/status-helper.ts

export const STATUS_REGISTRY = {
  request_status: {
    1: "Pending HOD Approval",    
    2: "Rejected by HOD",         
    5: "Pending IT Approval",    
    6: "Rejected by IT",          
    7: "Approved",               
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