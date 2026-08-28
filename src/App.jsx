import { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Edit2,
  X,
  Inbox,
  TrendingUp,
  Eye,
  EyeOff,
  RotateCcw,
  Plus,
  Download,
  Upload,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Import Komponen & Utilitas
import { formatRupiah, formatDateDisplay } from "./utils/formatters";
import MetricCards from "./components/MetricCards";
import "./style.css";

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    return JSON.parse(localStorage.getItem("finance_transactions")) || [];
  });
  const [savingTarget, setSavingTarget] = useState(() => {
    return (
      parseFloat(localStorage.getItem("finance_saving_target")) || 10000000
    );
  });
  const [currentFilter, setCurrentFilter] = useState("all");
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  const [inputName, setInputName] = useState("");
  const [inputAmount, setInputAmount] = useState("");
  const [inputType, setInputType] = useState("expense");
  const [inputDate, setInputDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [inputTarget, setInputTarget] = useState("");

  // Referensi untuk tombol upload file JSON tersembunyi
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("finance_transactions", JSON.stringify(transactions));
    localStorage.setItem("finance_saving_target", savingTarget.toString());
  }, [transactions, savingTarget]);

  const handleAmountChange = (e, setter) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value) {
      setter(new Intl.NumberFormat("id-ID").format(value));
    } else {
      setter("");
    }
  };

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  const filteredTransactions = transactions.filter((t) => {
    if (currentFilter === "income") return t.type === "income";
    if (currentFilter === "expense") return t.type === "expense";
    return true;
  });

  const percentage =
    savingTarget > 0
      ? Math.min(Math.max((balance / savingTarget) * 100, 0), 100)
      : 0;

  const getChartData = () => {
    if (transactions.length === 0) return [{ tanggal: "Hari Ini", saldo: 0 }];
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    let runningBalance = 0;
    return sorted.map((t) => {
      runningBalance += t.type === "income" ? t.amount : -t.amount;
      return { tanggal: formatDateDisplay(t.date), saldo: runningBalance };
    });
  };

  const chartData = getChartData();

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const rawAmount = parseFloat(
      inputAmount.replace(/\./g, "").replace(/,/g, ""),
    );
    if (!inputName || isNaN(rawAmount) || rawAmount <= 0 || !inputDate) return;
    setTransactions([
      {
        id: Date.now(),
        name: inputName,
        amount: rawAmount,
        type: inputType,
        date: inputDate,
      },
      ...transactions,
    ]);
    setIsTransactionModalOpen(false);
    setInputName("");
    setInputAmount("");
    setInputDate(new Date().toISOString().split("T")[0]);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm("Hapus transaksi ini?")) {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  const handleSaveTarget = (e) => {
    e.preventDefault();
    const rawTarget = parseFloat(
      inputTarget.replace(/\./g, "").replace(/,/g, ""),
    );
    if (!isNaN(rawTarget) && rawTarget > 0) {
      setSavingTarget(rawTarget);
      setIsTargetModalOpen(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm("Kosongkan seluruh data transaksi dan target?")) {
      setTransactions([]);
      setSavingTarget(10000000);
    }
  };

  // Fitu Backup (Ekspor JSON)
  const handleExportData = () => {
    try {
      const backupData = {
        transactions,
        savingTarget,
        version: "1.0",
        exportDate: new Date().toISOString(),
      };
      const dataString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `finance-tracker-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mengekspor data:", error);
      alert("Terjadi kesalahan saat mencadangkan data.");
    }
  };

  // Fitur Restore (Impor JSON)
  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);

        // Validasi struktur data sederhana
        if (!parsedData || typeof parsedData !== "object") {
          throw new Error("Format file tidak valid");
        }

        if (
          window.confirm(
            "Memulihkan data akan menimpa data yang ada saat ini. Lanjutkan?",
          )
        ) {
          if (Array.isArray(parsedData.transactions)) {
            setTransactions(parsedData.transactions);
          }
          if (parsedData.savingTarget && !isNaN(parsedData.savingTarget)) {
            setSavingTarget(parseFloat(parsedData.savingTarget));
          }
          alert("Data berhasil dipulihkan!");
        }
      } catch (error) {
        console.error("Gagal membaca file:", error);
        alert("File cadangan tidak valid atau rusak.");
      }
      // Reset input file agar bisa pilih file yang sama jika diperlukan
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      className="app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <main className="main">
        {/* Header Floating Minimalis & Modern */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.5rem 1.25rem",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1rem",
                fontWeight: "700",
                margin: 0,
                letterSpacing: "-0.02em",
                color: "#f8fafc",
              }}
            >
              MANAGEMENT
            </h1>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.65rem",
                margin: 0,
                fontWeight: "500",
              }}
            >
              Financial Dashboard
            </p>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {/* Tombol Sembunyikan Saldo */}
            <button
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="more-btn"
              title="Sembunyikan/Tampilkan Saldo"
              style={{
                padding: "5px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              {isBalanceHidden ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>

            {/* Tombol Backup (Ekspor JSON) */}
            <button
              onClick={handleExportData}
              className="more-btn"
              title="Backup Data"
              style={{
                padding: "5px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <Upload size={13} />
            </button>

            {/* Tombol Restore (Impor JSON) */}
            <button
              onClick={() => fileInputRef.current.click()}
              className="more-btn"
              title="Restore Data"
              style={{
                padding: "5px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <Download size={13} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportData}
              accept=".json"
              style={{ display: "none" }}
            />

            {/* Tombol Reset Data */}
            <button
              onClick={handleResetData}
              className="more-btn"
              title="Reset Data"
              style={{
                padding: "5px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={13} />
            </button>

            {/* Tombol Tambah Transaksi */}
            <button
              onClick={() => setIsTransactionModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 10px",
                background: "#38bdf8",
                color: "#0f172a",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              <Plus size={13} /> Tambah
            </button>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: "10px" }}></div>

        <MetricCards
          balance={balance}
          income={income}
          expense={expense}
          formatRupiah={(val) => formatRupiah(val, isBalanceHidden)}
        />

        <div
          className="card"
          style={{ marginTop: "1.5rem", padding: "1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <span
                className="label"
                style={{
                  display: "block",
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                  color: "var(--text-secondary)",
                  marginBottom: "2px",
                }}
              >
                ANALISIS
              </span>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Pergerakan Saldo
              </h3>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                background: "rgba(56, 189, 248, 0.1)",
                borderRadius: "10px",
                border: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              <TrendingUp
                size={18}
                style={{ color: "var(--accent-primary)" }}
              />
            </div>
          </div>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="tanggal"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#334155" }}
                  dy={8}
                />
                <YAxis hide={true} />
                <Tooltip
                  formatter={(value) => formatRupiah(value, isBalanceHidden)}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "0.85rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSaldo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ marginTop: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span className="label" style={{ margin: 0 }}>
              TARGET TABUNGAN
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="more-btn"
              onClick={() => {
                setInputTarget(
                  savingTarget
                    ? new Intl.NumberFormat("id-ID").format(savingTarget)
                    : "",
                );
                setIsTargetModalOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px",
              }}
            >
              <Edit2 size={16} />
            </motion.button>
          </div>
          <div
            className="saving-amount"
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "1rem",
            }}
          >
            {formatRupiah(savingTarget, isBalanceHidden)}
          </div>
          <div className="progress-bar" style={{ marginBottom: "0.5rem" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage.toFixed(1)}%` }}
              className="progress"
            ></motion.div>
          </div>
          <p className="saving-info" style={{ margin: 0 }}>
            Terkumpul {percentage.toFixed(1)}% dari target
          </p>
        </div>

        <div
          className="dashboard"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          <div className="left-column" style={{ width: "100%" }}>
            <div className="card">
              <div className="section-header">
                <div>
                  <span className="label">AKTIVITAS</span>
                  <h3>Riwayat Transaksi</h3>
                </div>
                <div className="filters">
                  <button
                    className={`filter-btn ${currentFilter === "all" ? "active" : ""}`}
                    onClick={() => setCurrentFilter("all")}
                  >
                    Semua
                  </button>
                  <button
                    className={`filter-btn ${currentFilter === "income" ? "active" : ""}`}
                    onClick={() => setCurrentFilter("income")}
                  >
                    Pemasukan
                  </button>
                  <button
                    className={`filter-btn ${currentFilter === "expense" ? "active" : ""}`}
                    onClick={() => setCurrentFilter("expense")}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              <div className="transaction-table">
                <div className="transaction-row table-head">
                  <span>Keterangan</span>
                  <span>Tanggal</span>
                  <span>Jenis</span>
                  <span>Jumlah</span>
                  <span>Aksi</span>
                </div>
                <AnimatePresence>
                  {filteredTransactions.map((t) => {
                    const isIncome = t.type === "income";
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="transaction-row"
                        key={t.id}
                      >
                        <span>{t.name}</span>
                        <span>{formatDateDisplay(t.date)}</span>
                        <span
                          style={{ color: isIncome ? "#10b981" : "#f43f5e" }}
                        >
                          {isIncome ? "Pemasukan" : "Pengeluaran"}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isIncome ? "#10b981" : "var(--text-primary)",
                          }}
                        >
                          {isIncome ? "+" : "-"}{" "}
                          {formatRupiah(t.amount, isBalanceHidden)}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="more-btn"
                          onClick={() => handleDeleteTransaction(t.id)}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <div
                className={`empty-state ${filteredTransactions.length === 0 ? "" : "hidden"}`}
              >
                <Inbox size={32} />
                <p>Belum ada riwayat transaksi.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Tambah Transaksi */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="modal-overlay active">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal"
            >
              <div className="modal-header">
                <div>
                  <h3>Tambah Transaksi</h3>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setIsTransactionModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddTransaction}>
                <div className="form-group">
                  <label>Keterangan</label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Contoh: Belanja Bulanan"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nominal</label>
                    <input
                      type="text"
                      value={inputAmount}
                      onChange={(e) => handleAmountChange(e, setInputAmount)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Jenis</label>
                    <select
                      value={inputType}
                      onChange={(e) => setInputType(e.target.value)}
                    >
                      <option value="income">Pemasukan</option>
                      <option value="expense">Pengeluaran</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Tanggal</label>
                  <input
                    type="date"
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary submit-btn">
                  Simpan Transaksi
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ubah Target Tabungan */}
      <AnimatePresence>
        {isTargetModalOpen && (
          <div className="modal-overlay active">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal"
            >
              <div className="modal-header">
                <h3>Ubah Target Tabungan</h3>
                <button
                  className="close-btn"
                  onClick={() => setIsTargetModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveTarget}>
                <div className="form-group">
                  <label>Target Tabungan (Rp)</label>
                  <input
                    type="text"
                    value={inputTarget}
                    onChange={(e) => handleAmountChange(e, setInputTarget)}
                    placeholder="Contoh: 10.000.000"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary submit-btn">
                  Simpan Target
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
