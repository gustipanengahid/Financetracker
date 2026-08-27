// src/utils/formatters.js

export const formatRupiah = (number, isHidden) => {
  if (isHidden) return "Rp ••••••";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(number)
    .replace("Rp", "Rp ");
};

export const formatDateDisplay = (dateString) => {
  if (!dateString) return "-";
  const dateObj = new Date(dateString);
  return dateObj.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
