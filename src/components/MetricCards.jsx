import { motion } from "framer-motion";

export default function MetricCards({
  balance,
  income,
  expense,
  formatRupiah,
}) {
  return (
    <div
      className="metric-cards-container"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
        marginTop: "1.5rem",
      }}
    >
      {/* Kartu Saldo (Utama) */}
      <motion.div
        whileHover={{ y: -4 }}
        className="card metric-card balance-main-card"
        style={{ marginBottom: 0, textAlign: "center", alignItems: "center" }}
      >
        <span className="label">SALDO</span>
        <h2 style={{ color: "var(--accent-primary)", fontSize: "1.8rem" }}>
          {formatRupiah(balance)}
        </h2>
      </motion.div>

      {/* Kartu Pemasukan */}
      <motion.div
        whileHover={{ y: -4 }}
        className="card metric-card"
        style={{ marginBottom: 0, textAlign: "center", alignItems: "center" }}
      >
        <span className="label">PEMASUKAN</span>
        <h2 id="total-income" style={{ fontSize: "1.4rem" }}>
          {formatRupiah(income)}
        </h2>
      </motion.div>

      {/* Kartu Pengeluaran */}
      <motion.div
        whileHover={{ y: -4 }}
        className="card metric-card"
        style={{ marginBottom: 0, textAlign: "center", alignItems: "center" }}
      >
        <span className="label">PENGELUARAN</span>
        <h2 id="total-expense" style={{ fontSize: "1.4rem" }}>
          {formatRupiah(expense)}
        </h2>
      </motion.div>
    </div>
  );
}
