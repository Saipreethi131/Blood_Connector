import Papa from 'papaparse';

export const downloadCSV = (filename, rows) => {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Opens a print-friendly window with a table — same window.print()-to-PDF convention
// used by the donation certificate generator.
export const openPrintTable = (title, columns, rows) => {
  const win = window.open('', '_blank');
  const tableRows = rows.map((row) =>
    `<tr>${columns.map((c) => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`
  ).join('');

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;padding:32px;color:#1A1A2E}
  h1{font-size:22px;color:#C0162C;margin-bottom:4px}
  .subtitle{color:#888;font-size:13px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#C0162C;color:#fff;text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase}
  td{padding:9px 12px;border-bottom:1px solid #eee}
  tr:nth-child(even){background:#fafafa}
  .print-btn{display:block;margin:24px auto 0;padding:10px 28px;background:#C0162C;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer}
  @media print{.print-btn{display:none}}
</style></head><body>
<h1>🩸 Blood Connector — ${title}</h1>
<p class="subtitle">Generated on ${new Date().toLocaleString('en-IN')}</p>
<table>
  <thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
</body></html>`);
  win.document.close();
  win.focus();
};
