/**
 * Universal CSV Exporter utility for Shineteck Inc.
 * Formats arrays of objects into cleanly sanitized CSV downloads.
 */

export function serializeCSV(data, headers = null) {
  if (!data?.length) return '';
  // Determine header columns
  const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
  const headerRow = headers ? Object.values(headers) : keys;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    // Sanitize after trimming so leading whitespace cannot conceal a formula.
    // Preserve numeric cells, including negative amounts, as numbers.
    if (typeof val === 'string' && /^[=+@-]/.test(str)) str = `'${str}`;
    // Escape double quotes by doubling them
    if (/[,"\r\n]/.test(str)) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [];
  // Add header row
  csvRows.push(headerRow.map(h => escapeCSV(h)).join(','));

  // Add data rows
  for (const row of data) {
    const values = keys.map(k => {
      const val = row[k];
      return escapeCSV(val);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\r\n');
}

export function exportToCSV(data, filename = 'export.csv', headers = null) {
  if (!data || !data.length) {
    alert('No records available to export.');
    return;
  }
  const csvString = serializeCSV(data, headers);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
