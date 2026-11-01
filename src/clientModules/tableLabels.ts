// Copies each table's header text onto its cells as data-label, so narrow screens can stack a row
// into "Key / Default: … / Description: …" instead of scrolling a three-column table sideways.
function labelTables(): void {
  document.querySelectorAll<HTMLTableElement>('.markdown table').forEach((table) => {
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent?.trim() ?? '');
    table.querySelectorAll('tbody tr').forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index]);
        }
      });
    });
  });
}

export function onRouteDidUpdate(): void {
  labelTables();
}
