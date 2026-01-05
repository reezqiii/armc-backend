import * as ExcelJS from "exceljs";
import { getAdminStatusLabel, getStatusLabel } from "utils/status-helper";

export async function buildCompletedExcelTemplate(requests) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Export Requests List");

    sheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'No Request', key: 'no_request', width: 15 },
        { header: 'Request Date', key: 'created_date', width: 30 },
        { header: 'Requestor', key: 'requestor', width: 20 },
        { header: 'Badge ID', key: 'badge_no', width: 15 },
        { header: 'Full Name', key: 'full_name', width: 25 },
        { header: 'Department', key: 'department', width: 30 },
        { header: 'Position', key: 'position', width: 30 },
        { header: 'Project', key: 'project', width: 20 },
        { header: 'Company', key: 'company', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Status', key: 'status_label', width: 20 },
        { header: 'Admin Status', key: 'admin_status', width: 20 },
    ];

    // style header
    sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1976D2" },
        };
        cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
        };
        cell.alignment = { horizontal: "center" };
    });

    let no = 1;

    requests.forEach(req => {
        sheet.addRow({
            no: no++,

            no_request: `ITF14-${String(req.r_id_request).padStart(6, '0')}`,
            created_date: req.r_created_date
                ? new Date(req.r_created_date).toLocaleString()
                : '-',

            requestor: req.u_full_name || '-',
            badge_no: req.r_badge_no || '-',
            full_name: req.r_full_name || '-',

            department: req.department_name || '-',
            position: req.position_name || '-',
            project: req.project_name || '-',

            company: req.c_company_name || '-',
            email: req.r_email || '-',
            type: req.r_type === 1 ? 'Public' : 'Login',
            status_label: getStatusLabel(req.r_request_status), 
            admin_status: getAdminStatusLabel(req.r_request_admin), 
        });
    });
    return workbook.xlsx.writeBuffer();
}