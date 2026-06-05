export function formatNumberWithCommas(number: number): string {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatNumberWithOneDecimal(number: number | null): string {
  if (number === null || number === undefined) {
    return "0.0";
  }
  return number.toFixed(1);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return "N/A";
  }

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return "N/A";
  }
}

export function formatNumber(number: number): string {
  if (!Number.isFinite(number)) {
    return "0.0";
  }

  const formattedNumber = number.toFixed(1);
  return formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
