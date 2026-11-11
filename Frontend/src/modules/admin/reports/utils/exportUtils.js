/**
 * Export Utilities for Reports & Analytics
 * Supports RFC 4180 CSV, Excel (XLS), and Clean Print / PDF triggers.
 */

export const exportToCSV = (filename, columns = [], rows = []) => {
  if (!columns.length || !rows.length) return;

  const headerRow = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
  const bodyRows = rows.map(row => {
    return columns.map(c => {
      const val = row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [headerRow, ...bodyRows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToExcel = (filename, columns = [], rows = []) => {
  if (!columns.length || !rows.length) return;

  let tableHtml = '<table border="1"><thead><tr>';
  columns.forEach(c => {
    tableHtml += `<th style="background-color:#1e3a8a;color:#ffffff;font-weight:bold;">${c.header}</th>`;
  });
  tableHtml += '</tr></thead><tbody>';

  rows.forEach(r => {
    tableHtml += '<tr>';
    columns.forEach(c => {
      const val = r[c.key] !== undefined && r[c.key] !== null ? r[c.key] : '';
      tableHtml += `<td>${val}</td>`;
    });
    tableHtml += '</tr>';
  });
  tableHtml += '</tbody></table>';

  const blob = new Blob(['\uFEFF' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, `${filename}.xls`);
};

export const triggerPrintPDF = () => {
  if (typeof window !== 'undefined') {
    window.print();
  }
};

const downloadBlob = (blob, fullFilename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

