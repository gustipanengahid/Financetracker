import { motion } from "framer-motion";
import { RefreshCw, Plus, Eye, EyeOff, Camera } from "lucide-react";

export default function Header({
  isBalanceHidden,
  setIsBalanceHidden,
  handleResetData,
  setIsTransactionModalOpen,
  handleScanReceipt,
}) {
  return (
    <header
      className="topbar"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "100%",
        padding: "0.5rem 0 1rem 0",
      }}
    >
      {/* Baris Atas: Judul & Logo Mata Berdampingan Dekat */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div>
          <span
            className="subtitle"
            style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}
          >
            FINANCE MANAGEMENT
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Hide Saldo
            </h1>
            <motion.button
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(56, 189, 248, 0.15)",
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-active)",
                borderRadius: "50%",
                width: "24px", // Diperkecil dari 28px ke 24px
                height: "24px", // Diperkecil dari 28px ke 24px
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-primary)",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title={isBalanceHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
            >
              {/* Ukuran ikon diubah dari 14 ke 11 agar lebih kecil & rapi */}
              {isBalanceHidden ? <EyeOff size={11} /> : <Eye size={11} />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Baris Bawah: Tombol Aksi (Reset, Scan, Transaksi) */}
      <div style={{ display: "flex", gap: "8px", width: "100%" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="btn btn-secondary"
          onClick={handleResetData}
          style={{
            flex: 1,
            padding: "10px 6px",
            fontSize: "0.8rem",
            borderRadius: "10px",
            justifyContent: "center",
          }}
        >
          <RefreshCw size={14} />
          <span>Reset</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="btn btn-secondary"
          onClick={handleScanReceipt}
          style={{
            flex: 1,
            padding: "10px 6px",
            fontSize: "0.8rem",
            borderRadius: "10px",
            justifyContent: "center",
          }}
        >
          <Camera size={14} />
          <span>Scan</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="btn btn-primary"
          onClick={() => setIsTransactionModalOpen(true)}
          style={{
            flex: 1.5,
            padding: "10px 8px",
            fontSize: "0.8rem",
            borderRadius: "10px",
            justifyContent: "center",
          }}
        >
          <Plus size={14} />
          <span>Transaksi</span>
        </motion.button>
      </div>
    </header>
  );
}
