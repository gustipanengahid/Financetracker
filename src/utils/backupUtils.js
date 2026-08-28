// src/utils/backupUtils.js

export const exportDataToJson = (appState) => {
  try {
    // Ubah objek state menjadi string JSON yang rapi (indentasi 2 spasi)
    const dataString = JSON.stringify(appState, null, 2);

    // Buat objek Blob dengan tipe data application/json
    const blob = new Blob([dataString], { type: "application/json" });

    // Buat URL sementara untuk file Blob
    const url = URL.createObjectURL(blob);

    // Buat elemen anchor <a> tersembunyi untuk memicu download
    const link = document.createElement("a");
    link.href = url;

    // Format nama file dengan tanggal hari ini
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `finance backup-${dateStr}.json`;

    // Simulasikan klik untuk mendownload
    document.body.appendChild(link);
    link.click();

    // Bersihkan memori dan elemen setelah selesai
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: "Data berhasil diekspor!" };
  } catch (error) {
    console.error("Gagal melakukan ekspor data:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat mengekspor data.",
    };
  }
};
