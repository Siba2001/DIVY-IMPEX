// Helper service for CSV, Excel, and Print Export

export const exportToCSV = (filename, rows) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToExcel = (filename, rows) => {
  // In frontend prototype without heavy XLSX parser dependency, generate clean tab-delimited XLS file compatible with Microsoft Excel
  if (!rows || !rows.length) return;
  const separator = '\t';
  const keys = Object.keys(rows[0]);
  const excelContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            const val = row[k] === null || row[k] === undefined ? '' : row[k];
            return String(val).replace(/\t/g, ' ');
          })
          .join(separator)
      )
      .join('\n');

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.click();
};

export const triggerPrint = () => {
  window.print();
};
