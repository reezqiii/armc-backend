import * as ExcelJS from "exceljs";

export async function buildUserListExcel(users) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ARMC System";
  const sheet = workbook.addWorksheet("User List", {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  const COLOR = {
    headerBg: "FF008080",
    headerText: "FFFFFFFF",
    subheaderBg: "FFF0FDFA",
    subheaderText: "FF0D9488",
    rowEven: "FFF9FAFB",
    rowOdd: "FFFFFFFF",
    border: "FFD1D5DB",
  };

  const columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Username", key: "username", width: 20 },
    { header: "Badge ID", key: "badge_no", width: 15 },
    { header: "Full Name", key: "full_name", width: 30 },
    { header: "Project", key: "project", width: 25 },
    { header: "Department", key: "department", width: 25 },
    { header: "Position", key: "position", width: 25 },
    { header: "Role", key: "role", width: 20 },
  ];

  sheet.columns = columns;
  const lastCol = String.fromCharCode(64 + columns.length);

  sheet.mergeCells(`A1:${lastCol}1`);
  const titleCell = sheet.getCell("A1");
  titleCell.value = "ARMC SYSTEM - USER ACCOUNT LIST";
  Object.assign(titleCell, {
    font: { bold: true, size: 14, color: { argb: COLOR.headerText } },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR.headerBg },
    },
    alignment: { horizontal: "center", vertical: "middle" },
  });
  sheet.getRow(1).height = 35;

  sheet.mergeCells(`A2:${lastCol}2`);
  const metaCell = sheet.getCell("A2");
  metaCell.value = `Generated: ${new Date().toLocaleString()} | Total Records: ${users.length}`;
  Object.assign(metaCell, {
    font: { italic: true, size: 10, color: { argb: COLOR.subheaderText } },
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR.subheaderBg },
    },
    alignment: { horizontal: "center", vertical: "middle" },
  });

  const headerRow = sheet.getRow(3);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    Object.assign(cell, {
      font: { bold: true, color: { argb: COLOR.headerText } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLOR.headerBg },
      },
      alignment: { horizontal: "center", vertical: "middle" },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "medium", color: { argb: "FF004D40" } },
        right: { style: "thin" },
      },
    });
  });
  headerRow.height = 25;

  users.forEach((user, index) => {
    const rowNum = index + 4;
    const isEven = index % 2 === 0;

    const values = [
      index + 1,
      user.username || "-",
      user.badge_no || "-",
      user.full_name || "-",
      user.project?.project_name || user.project_name || "-",
      user.department?.name_of_department || user.department_name || "-",
      user.position?.position_name || user.position_name || "-",
      user.role?.role_name || user.role_name || "-",
    ];

    const row = sheet.getRow(rowNum);
    row.values = values;

    row.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? COLOR.rowEven : COLOR.rowOdd },
      };
      cell.border = {
        top: { style: "hair" },
        left: { style: "thin" },
        bottom: { style: "hair" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    });

    row.getCell(1).alignment = { horizontal: "center" };
  });

  return workbook.xlsx.writeBuffer();
}
