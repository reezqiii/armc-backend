import * as ExcelJS from "exceljs";
import { getStatusLabel } from "utils/status-helper";

export async function buildCompletedExcelTemplate(requests) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ARMC System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Request List", {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  const COLOR = {
    headerBg: "FF1565C0", 
    headerText: "FFFFFFFF", 
    subheaderBg: "FFE3F2FD",
    subheaderText: "FF0D47A1",
    rowEven: "FFF5F9FF",
    rowOdd: "FFFFFFFF",
    border: "FFB0BEC5",
    totalBg: "FF1565C0",
    totalText: "FFFFFFFF",
    accent: "FF42A5F5",
  };

  const columns = [
    { header: "No", key: "no", width: 6 },
    { header: "No Request", key: "no_request", width: 18 },
    { header: "Request Date", key: "created_date", width: 22 },
    { header: "Requestor", key: "requestor", width: 22 },
    { header: "Badge ID", key: "badge_no", width: 14 },
    { header: "Full Name", key: "full_name", width: 26 },
    { header: "Department", key: "department", width: 28 },
    { header: "Position", key: "position", width: 26 },
    { header: "Project", key: "project", width: 22 },
    { header: "Email", key: "email", width: 32 },
    { header: "Status", key: "status_label", width: 28 },
    { header: "Admin Status", key: "admin_status", width: 22 },
    { header: "Category Account", key: "category_account", width: 22 },
  ];

  sheet.columns = columns;
  const totalCols = columns.length;
  const lastCol = String.fromCharCode(64 + totalCols);

  sheet.mergeCells(`A1:${lastCol}1`);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "ACCESS REQUEST LIST";
  titleCell.font = {
    name: "Arial",
    bold: true,
    size: 13,
    color: { argb: COLOR.headerText },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR.headerBg },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 32;

  sheet.mergeCells(`A2:${lastCol}2`);
  const metaCell = sheet.getCell("A2");
  metaCell.value = `Generated: ${new Date().toLocaleString("id-ID")}   |   Total Records: ${requests.length}`;
  metaCell.font = {
    name: "Arial",
    italic: true,
    size: 9,
    color: { argb: COLOR.subheaderText },
  };
  metaCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR.subheaderBg },
  };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 18;

  const headerRow = sheet.getRow(3);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = {
      name: "Arial",
      bold: true,
      size: 10,
      color: { argb: COLOR.headerText },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR.headerBg },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: COLOR.border } },
      bottom: { style: "medium", color: { argb: "FF0D47A1" } },
      left: { style: "thin", color: { argb: COLOR.border } },
      right: { style: "thin", color: { argb: COLOR.border } },
    };
  });
  headerRow.height = 28;

  sheet.autoFilter = { from: "A3", to: `${lastCol}3` };

  const statusColorMap: Record<string, string> = {
    Draft: "FF9E9E9E",
    "Awaiting HOD Approval": "FFFFA726",
    "Awaiting IT Manager Approval": "FFFFA726",
    Completed: "FF43A047",
    "Rejected by HOD Approval": "FFE53935",
    "Rejected by IT Manager Approval": "FFE53935",
  };

  let no = 1;

  requests.forEach((req, index) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven ? COLOR.rowEven : COLOR.rowOdd;
    const rowNum = index + 4; 

    const statusLabel = getStatusLabel("request_status", req.r_request_status);

    const values = [
      no++,
      `ITF14-${String(req.r_id_request).padStart(6, "0")}`,
      req.r_created_date
        ? new Date(req.r_created_date).toLocaleString("id-ID")
        : "-",
      req.u_full_name || "-",
      req.r_badge_no || "-",
      req.r_full_name || "-",
      req.department_name || "-",
      req.position_name || "-",
      req.project_name || "-",
      req.r_email || "-",
      statusLabel,
      req.cat_cat_name || req.cat_name || req.category_account_name || "-",
    ];

    const dataRow = sheet.getRow(rowNum);
    dataRow.height = 20;

    values.forEach((val, colIdx) => {
      const cell = dataRow.getCell(colIdx + 1);
      cell.value = val;
      cell.font = { name: "Arial", size: 9 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBg },
      };
      cell.border = {
        top: { style: "hair", color: { argb: COLOR.border } },
        bottom: { style: "hair", color: { argb: COLOR.border } },
        left: { style: "thin", color: { argb: COLOR.border } },
        right: { style: "thin", color: { argb: COLOR.border } },
      };
      cell.alignment = { vertical: "middle", wrapText: false };

      if (colIdx === 0) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      if (colIdx === 12) {
        const statusColor = statusColorMap[statusLabel];
        if (statusColor) {
          cell.font = {
            name: "Arial",
            size: 9,
            bold: true,
            color: { argb: statusColor },
          };
        }
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  });

  const totalRowNum = requests.length + 4;
  sheet.mergeCells(`A${totalRowNum}:B${totalRowNum}`);
  const totalCell = sheet.getCell(`A${totalRowNum}`);
  totalCell.value = `Total Records: ${requests.length}`;
  totalCell.font = {
    name: "Arial",
    bold: true,
    size: 10,
    color: { argb: COLOR.totalText },
  };
  totalCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR.totalBg },
  };
  totalCell.alignment = { horizontal: "center", vertical: "middle" };

  for (let c = 3; c <= totalCols; c++) {
    const cell = sheet.getRow(totalRowNum).getCell(c);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR.totalBg },
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF0D47A1" } },
    };
  }
  sheet.getRow(totalRowNum).height = 22;

  return workbook.xlsx.writeBuffer();
}
