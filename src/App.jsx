import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit2,
  X,
  Inbox,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
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
import { createWorker } from "tesseract.js";

// Import Komponen & Utilitas
import { formatRupiah, formatDateDisplay } from "./utils/formatters";
import Header from "./components/Header";
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
  const [isScanning, setIsScanning] = useState(false);

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

  const handleScanReceipt = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Fungsi Scan Diperluas untuk mendeteksi berbagai variasi kata total / jumlah
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const worker = await createWorker("ind");
      const ret = await worker.recognize(file);
      const text = ret.data.text;
      await worker.terminate();

      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const fullTextLower = text.toLowerCase();

      // 1. Ekstraksi Nominal dengan Prioritas Kata Kunci Belanja
      let detectedAmount = "";

      for (let i = 0; i < lines.length; i++) {
        const lineLower = lines[i].toLowerCase();

        // Deteksi kata kunci: "total", "jumlah", "grand", "subtotal", dll.
        const isTargetKeyword =
          (lineLower.includes("total") ||
            lineLower.includes("jumlah") ||
            lineLower.includes("grand")) &&
          !lineLower.includes("kembali") &&
          !lineLower.includes("tunai");

        if (isTargetKeyword) {
          let targetText = lines[i];
          if (!/\d/.test(targetText) && i + 1 < lines.length) {
            targetText += " " + lines[i + 1];
          }

          const numbers = targetText.match(/\d{1,3}(?:\.\d{3})+|\d+/g);
          if (numbers) {
            const cleanedNum = numbers.join("").replace(/\D/g, "");
            const numVal = parseInt(cleanedNum, 10);
            if (numVal >= 1000 && numVal <= 100000000) {
              detectedAmount = cleanedNum;
              break;
            }
          }
        }
      }

      // Fallback: Cari angka sebelum kata "bayar" atau "tunai" jika kata kunci utama tidak ditemukan
      if (!detectedAmount) {
        for (let i = 0; i < lines.length; i++) {
          const lineLower = lines[i].toLowerCase();
          if (
            (lineLower.includes("bayar") || lineLower.includes("tunai")) &&
            !lineLower.includes("kembali")
          ) {
            if (i > 0) {
              const prevNumbers = lines[i - 1].match(
                /\d{1,3}(?:\.\d{3})+|\d+/g,
              );
              if (prevNumbers) {
                detectedAmount = prevNumbers.join("").replace(/\D/g, "");
                break;
              }
            }
          }
        }
      }

      if (detectedAmount) {
        detectedAmount = new Intl.NumberFormat("id-ID").format(
          parseInt(detectedAmount, 10),
        );
      }

      // 2. Ekstraksi Tanggal Multi-Format
      let detectedDate = new Date().toISOString().split("T")[0];

      const isoDateMatch = text.match(/\b(20\d{2})[-/](\d{2})[-/](\d{2})\b/);
      const dmyNumericMatch = text.match(/\b(\d{2})[-/](\d{2})[-/](20\d{2})\b/);
      const monthsMap = {
        januari: "01",
        jan: "01",
        februari: "02",
        feb: "02",
        maret: "03",
        mar: "03",
        april: "04",
        apr: "04",
        mei: "05",
        may: "05",
        juni: "06",
        jun: "06",
        juli: "07",
        jul: "07",
        agustus: "08",
        agt: "08",
        aug: "08",
        september: "09",
        sep: "09",
        oktober: "10",
        okt: "10",
        oct: "10",
        november: "11",
        nov: "11",
        desember: "12",
        des: "12",
        dec: "12",
      };

      const textDateRegex = new RegExp(
        `\\b(\\d{1,2})\\s+(${Object.keys(monthsMap).join("|")})\\s+(20\\d{2})\\b`,
        "i",
      );
      const textDateMatch = text.match(textDateRegex);

      if (isoDateMatch) {
        detectedDate = `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`;
      } else if (dmyNumericMatch) {
        detectedDate = `${dmyNumericMatch[3]}-${dmyNumericMatch[2]}-${dmyNumericMatch[1]}`;
      } else if (textDateMatch) {
        const day = textDateMatch[1].padStart(2, "0");
        const monthKey = textDateMatch[2].toLowerCase();
        const month = monthsMap[monthKey] || "01";
        const year = textDateMatch[3];
        detectedDate = `${year}-${month}-${day}`;
      }

      // 3. Kamus Pintar Nama Merchant
      let storeName = "Belanja Struk";

      if (/toko\s*selada/i.test(fullTextLower)) {
        storeName = "Toko Selada";
      } else if (
        /pertamin|spbu|pertalite|pertamax|solar|dexlite/i.test(fullTextLower)
      ) {
        storeName = "SPBU Pertamina";
      } else if (/indomaret/i.test(fullTextLower)) {
        storeName = "Indomaret";
      } else if (/alfamart|alfamidi/i.test(fullTextLower)) {
        storeName = "Alfamart";
      } else if (/mcdonald|mcd/i.test(fullTextLower)) {
        storeName = "McDonald's";
      } else if (/kfc|kentucky/i.test(fullTextLower)) {
        storeName = "KFC";
      } else if (/starbucks|sbux/i.test(fullTextLower)) {
        storeName = "Starbucks";
      } else {
        for (let line of lines) {
          if (
            /toko|cafe|mart|warung|rumah\s*makan|rm[\s.]|pt[\s.]|cv[\s.]/i.test(
              line,
            )
          ) {
            let cleanedLine = line.replace(/[^a-zA-Z0-9\s.-]/g, "").trim();
            if (
              cleanedLine.length >= 3 &&
              !/terima kasih|selamat datang|layanan/i.test(cleanedLine)
            ) {
              storeName = cleanedLine;
              break;
            }
          }
        }

        if (storeName === "Belanja Struk" && lines.length > 0) {
          for (let i = 0; i < Math.min(lines.length, 3); i++) {
            let candidate = lines[i].replace(/[^a-zA-Z0-9\s.-]/g, "").trim();
            if (
              candidate.length >= 3 &&
              !/\b(jl|jalan|no\.|rt|rw|telp|hp|waktu|tanggal|kasir|pondok)\b/i.test(
                candidate,
              ) &&
              !/^\d+$/.test(candidate)
            ) {
              storeName = candidate;
              break;
            }
          }
        }
      }

      setInputName(storeName);
      setInputType("expense");
      if (detectedAmount) setInputAmount(detectedAmount);
      setInputDate(detectedDate);

      setIsTransactionModalOpen(true);
    } catch (error) {
      console.error("Gagal memindai struk:", error);
      alert("Gagal membaca gambar struk. Silakan isi secara manual.");
    } finally {
      setIsScanning(false);
      e.target.value = null;
    }
  };

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  const getFinancialHealth = () => {
    if (income === 0 && expense === 0) {
      return {
        score: 100,
        label: "Belum Ada Data",
        color: "#94a3b8",
        icon: ShieldCheck,
      };
    }
    const expenseRatio = income > 0 ? (expense / income) * 100 : 100;
    if (expenseRatio <= 50 && balance >= 0) {
      return {
        score: 90,
        label: "Sangat Sehat",
        color: "#10b981",
        icon: ShieldCheck,
      };
    } else if (expenseRatio <= 80 && balance >= 0) {
      return {
        score: 70,
        label: "Perlu Perhatian",
        color: "#f59e0b",
        icon: ShieldAlert,
      };
    } else {
      return {
        score: 40,
        label: "Bahaya / Defisit",
        color: "#f43f5e",
        icon: ShieldX,
      };
    }
  };

  const financialHealth = getFinancialHealth();
  const HealthIcon = financialHealth.icon;

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

  return (
    <motion.div
      className="app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
      />

      {isScanning && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            Menganalisis Struk...
          </div>
        </div>
      )}

      <main className="main">
        <Header
          isBalanceHidden={isBalanceHidden}
          setIsBalanceHidden={setIsBalanceHidden}
          handleResetData={handleResetData}
          setIsTransactionModalOpen={setIsTransactionModalOpen}
          handleScanReceipt={handleScanReceipt}
        />

        <MetricCards
          balance={balance}
          income={income}
          expense={expense}
          formatRupiah={(val) => formatRupiah(val, isBalanceHidden)}
        />

        <div className="status-health-grid">
          <div
            className="status-banner"
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor:
                balance < 1000000
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(16, 185, 129, 0.15)",
              border:
                balance < 1000000 ? "1px solid #ef4444" : "1px solid #10b981",
              color: balance < 1000000 ? "#fca5a5" : "#6ee7b7",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.9rem",
            }}
          >
            {balance < 1000000 ? (
              <AlertTriangle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span
              dangerouslySetInnerHTML={{
                __html:
                  balance < 1000000
                    ? "<strong>Peringatan:</strong> Saldo di bawah Rp 1.000.000!"
                    : "<strong>Status:</strong> Keuangan aman.",
              }}
            />
          </div>

          <div
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              backgroundColor: "rgba(30, 41, 59, 0.7)",
              border: `1px solid ${financialHealth.color}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span className="label" style={{ fontSize: "0.7rem" }}>
                KESEHATAN DOMPET
              </span>
              <div
                style={{
                  fontWeight: 700,
                  color: financialHealth.color,
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <HealthIcon size={16} /> {financialHealth.label}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fff" }}
              >
                {financialHealth.score}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>/100</span>
            </div>
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
            {formatRupiah(savingTarget)}
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
                  <p className="saving-info">Hasil scan otomatis dari struk</p>
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
