import * as ExcelJS from "exceljs";

export async function buildCompletedExcelTemplate(requests) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Export Requests List");

    sheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'No Request', key: 'no_request', width: 15 },
        { header: 'Request Date', key: 'created_date', width: 20 },
        { header: 'Requestor', key: 'requestor', width: 30 },
        { header: 'Badge ID', key: 'badge_no', width: 15 },
        { header: 'Full Name', key: 'full_name', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Position', key: 'position', width: 20 },
        { header: 'Project', key: 'project', width: 20 },
        { header: 'Company', key: 'company', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Type', key: 'type', width: 30 },
        // { header: 'HOD Approval By', key: 'hod_by', width: 25 },
        // { header: 'HOD Approval Date', key: 'hod_date', width: 20 },
        // { header: 'Lead IT Approval By', key: 'lead_it_by', width: 25 },
        // { header: 'Lead IT Approval Date', key: 'lead_it_date', width: 20 },
        // { header: 'IT Manager Approval By', key: 'it_manager_by', width: 25 },
        // { header: 'IT Manager Approval Date', key: 'it_manager_date', width: 20 },
        // { header: 'Status', key: 'status', width: 15 },
        // { header: 'Admin Status', key: 'admin_status', width: 15 },
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

            no_request: req.r_id_request,
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

            // approval_hod_by: req.approval_hod_by?.full_name || '-',
            // approval_hod_date_at: req.approval_hod_date_at
            //     ? new Date(req.approval_hod_date_at).toLocaleString()
            //     : '-',

            // approval_lead_it_by: req.approval_lead_it_by?.full_name || '-',
            // approval_lead_it_date_at: req.approval_lead_it_date_at
            //     ? new Date(req.approval_lead_it_date_at).toLocaleString()
            //     : '-',
            // approval_it_hod_by: req.approval_it_hod_by?.full_name || '-',
            // approval_it_hod_date_at: req.approval_it_hod_date_at
            //     ? new Date(req.approval_it_hod_date_at).toLocaleString()
            //     : '-',
        });
    });

    return workbook.xlsx.writeBuffer();
}
