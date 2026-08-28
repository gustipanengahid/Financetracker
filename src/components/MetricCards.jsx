import { motion } from "framer-motion";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function MetricCards({
  balance,
  income,
  expense,
  formatRupiah,
}) {
  // Fungsi logika dinamis untuk menentukan status kesehatan dompet berdasarkan saldo
  const getFinancialHealth = (currentBalance) => {
    if (currentBalance >= 1000000) {
      return {
        score: 90,
        label: "Aman & Stabil",
        color: "#34d399",
        icon: CheckCircle2,
      };
    } else if (currentBalance >= 500000) {
      return {
        score: 70,
        label: "Perlu Perhatian",
        color: "#f59e0b",
        icon: AlertTriangle,
      };
    } else {
      return {
        score: 40,
        label: "Bahaya / Krisis",
        color: "#f43f5e",
        icon: ShieldAlert,
      };
    }
  };

  const financialHealth = getFinancialHealth(balance);
  const HealthIcon = financialHealth.icon;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginTop: "1.5rem",
      }}
    >
      {/* 1. BAGIAN PERTAMA: Kartu Peringatan (Berdiri Sendiri / Full Width) */}
      <motion.div
        variants={itemVariants}
        style={{
          padding: "12px 16px",
          borderRadius: "12px",
          backgroundColor: "rgba(15, 23, 42, 0.25)",
          border: `1px solid ${
            balance < 1000000
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(16, 185, 129, 0.2)"
          }`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.825rem",
          color: "#cbd5e1",
          width: "100%",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            color: balance < 1000000 ? "#f87171" : "#34d399",
            flexShrink: 0,
          }}
        >
          {balance < 1000000 ? (
            <AlertTriangle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
        </span>
        <span
          dangerouslySetInnerHTML={{
            __html:
              balance < 1000000
                ? "Peringatan: Saldo di bawah <span style='color:#f87171; font-weight:600;'>Rp 1.000.000</span>"
                : "Status Keuangan: <span style='color:#34d399; font-weight:600;'>Aman</span>",
          }}
        />
      </motion.div>

      {/* 2. BAGIAN KEDUA: Kartu Status Kesehatan (Berdiri Sendiri / Full Width) */}
      <motion.div
        variants={itemVariants}
        style={{
          padding: "12px 16px",
          borderRadius: "12px",
          backgroundColor: "rgba(15, 23, 42, 0.25)",
          border: `1px solid ${financialHealth.color}33`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.825rem",
          color: "#cbd5e1",
          width: "100%",
        }}
      >
        <span
          style={{
            color: financialHealth.color,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <HealthIcon size={16} />
        </span>
        <span style={{ color: "#94a3b8" }}>
          Kesehatan:{" "}
          <strong style={{ color: financialHealth.color }}>
            {financialHealth.label}
          </strong>{" "}
          ({financialHealth.score}/100)
        </span>
      </motion.div>

      {/* 3. BAGIAN KETIGA: Kartu Total Saldo */}
      <motion.div
        variants={itemVariants}
        style={{
          background: "rgba(15, 23, 42, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.08em",
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            TOTAL SALDO
          </span>
          <Wallet size={15} style={{ color: "#38bdf8" }} />
        </div>
        <h2
          style={{
            color: "#f8fafc",
            fontSize: "1.35rem",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {formatRupiah(balance)}
        </h2>
      </motion.div>

      {/* 4. BAGIAN KEEMPAT: Grid Pemasukan & Pengeluaran */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1rem",
        }}
      >
        {/* Kartu Pemasukan */}
        <motion.div
          variants={itemVariants}
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "14px",
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              PEMASUKAN
            </span>
            <ArrowDownLeft size={15} style={{ color: "#34d399" }} />
          </div>
          <h2
            id="total-income"
            style={{
              color: "#34d399",
              fontSize: "1.1rem",
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {formatRupiah(income)}
          </h2>
        </motion.div>

        {/* Kartu Pengeluaran */}
        <motion.div
          variants={itemVariants}
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "14px",
            padding: "1rem 1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              PENGELUARAN
            </span>
            <ArrowUpRight size={15} style={{ color: "#fb7185" }} />
          </div>
          <h2
            id="total-expense"
            style={{
              color: "#fb7185",
              fontSize: "1.1rem",
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {formatRupiah(expense)}
          </h2>
        </motion.div>
      </div>
    </motion.div>
  );
}
