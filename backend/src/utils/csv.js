// Quoted when the value has a separator, a quote or a line break
const cell = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

// "rows" is a list of lists, header included. Starts with a BOM so the accents are read as UTF-8
export const toCsv = (rows) => `﻿${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`;
