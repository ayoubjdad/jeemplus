export const convertTimestampToTime = (timestamp) => {
  const date = new Date(timestamp * 1000);
  date.setHours(date.getUTCHours() + 1);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const convertTimestampToDate = (timestamp) => {
  const date = new Date(timestamp);

  // Format the date to DD-MM-YYYY
  const formattedDate = `${String(date.getDate()).padStart(2, "0")}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${date.getFullYear()}`;
  return formattedDate;
};

// * Convert this 2024-10-19T15:17:25.174Z to this 19 أكتوبر 2024 - 15:17
export function convertDateToArarbic(dateString) {
  const date = new Date(dateString);

  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليوز",
    "غشت",
    "شتنبر",
    "أكتوبر",
    "نونبر",
    "دجنبر",
  ];

  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} - ${hours}:${minutes}`;
  // return `${day} ${month} ${year}`;
}

// * Convert from 2024-10-19T15:17:25.174Z to 19/10/2024
export function newsFormatDate(isoString) {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

export function gamesFormatDate(isoString) {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}
