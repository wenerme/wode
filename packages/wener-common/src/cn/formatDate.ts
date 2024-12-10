export function formatDate(date: Date, format: 'yyyyMMDD') {
  switch (format) {
    case 'yyyyMMDD': {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}${month}${day}`;
    }
    default:
      throw new Error(`Invalid format`);
  }
}
