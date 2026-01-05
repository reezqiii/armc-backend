// src/utils/status-helper.ts

export const REQUEST_STATUS_LABELS: Record<number, string> = {
    0: "Draft",
    1: "Awaiting HOD Approval",
    2: "Rejected HOD Approval",
    3: "Awaiting Lead IT Approval",
    4: "Rejected Lead IT Approval",
    5: "Awaiting IT Manager Approval",
    6: "Rejected IT Manager Approval",
    7: "Completed",
    8: "Returned",
};

// Mapping Admin Status (IT Technical Progress)
export const ADMIN_STATUS_LABELS: Record<number, string> = {
    0: "On Queue",
    1: "On Progress",
    2: "Completed",
};

export const getStatusLabel = (code: number) => REQUEST_STATUS_LABELS[code] || "Unknown";
export const getAdminStatusLabel = (code: number) => ADMIN_STATUS_LABELS[code] || "-";