import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";

const STATUS_LABELS = {
  pending:  { label: "Gözləyən",       cls: "pending"  },
  approved: { label: "Təsdiqlənmiş",   cls: "approved" },
  rejected: { label: "Rədd edilmiş",   cls: "rejected" },
  returned: { label: "Qaytarılmış",    cls: "returned" },
};

function AdminRentalsPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const tokenAdmin = localStorage.getItem("tokenAdmin");

  const [rentals, setRentals] = useState([]);
  const [filter, setFilter] = useState("all");
  const [startDates, setStartDates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenAdmin) { navigate("/admin/login"); return; }
    fetchRentals();
  }, [tokenAdmin]);

  const fetchRentals = () => {
    setLoading(true);
    axios.get(Base_Url_Server + "rentals", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })
      .then(r => setRentals(r.data.data.rentals || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const today = new Date().toISOString().split("T")[0];

  const handleApprove = async (id) => {
    const start = startDates[id] || today;
    try {
      await axios.patch(Base_Url_Server + `rentals/${id}/approve`, { start_date: start }, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      fetchRentals();
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.patch(Base_Url_Server + `rentals/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      fetchRentals();
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
    }
  };

  const handleReturn = async (id) => {
    try {
      await axios.patch(Base_Url_Server + `rentals/${id}/return`, {}, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      fetchRentals();
    } catch (err) {
      alert(err.response?.data?.message || "Xəta baş verdi");
    }
  };

  const filtered = filter === "all" ? rentals : rentals.filter(r => r.status === filter);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📚 Kirayə Sorğuları</h2>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        {["all", "pending", "approved", "rejected", "returned"].map(s => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.filterActive : ""}`}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "Hamısı" : STATUS_LABELS[s]?.label}
            <span className={styles.filterCount}>
              {s === "all" ? rentals.length : rentals.filter(r => r.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.emptyMsg}>Yüklənir...</p>
      ) : filtered.length === 0 ? (
        <p className={styles.emptyMsg}>Sorğu yoxdur.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>İstifadəçi</th>
                <th>Kitab</th>
                <th>Müəssisə</th>
                <th>Müddət</th>
                <th>Status</th>
                <th>Başlama / Bitmə</th>
                <th>Tarix</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>
                    <div className={styles.userCell}>
                      <span className={styles.userLogin}>{r.user_login}</span>
                      <span className={styles.userEmail}>{r.user_email}</span>
                    </div>
                  </td>
                  <td className={styles.bookTitle}>{r.pdf_title}</td>
                  <td>{r.institution_name}</td>
                  <td>{r.duration_days} gün</td>
                  <td>
                    <span className={`${styles.chip} ${styles[STATUS_LABELS[r.status]?.cls]}`}>
                      {STATUS_LABELS[r.status]?.label || r.status}
                    </span>
                  </td>
                  <td className={styles.dates}>
                    {r.start_date ? (
                      <>
                        <span>{r.start_date?.split("T")[0]}</span>
                        <span> → </span>
                        <span>{r.end_date?.split("T")[0]}</span>
                      </>
                    ) : "—"}
                  </td>
                  <td>{r.created_at?.split("T")[0]}</td>
                  <td>
                    {r.status === "pending" && (
                      <div className={styles.actionGroup}>
                        <input
                          type="date"
                          className={styles.dateInput}
                          value={startDates[r.id] || today}
                          min={today}
                          onChange={e => setStartDates(p => ({ ...p, [r.id]: e.target.value }))}
                          title="Başlama tarixi"
                        />
                        <button className={styles.btnApprove} onClick={() => handleApprove(r.id)}>Təsdiqlə</button>
                        <button className={styles.btnReject}  onClick={() => handleReject(r.id)}>Rədd et</button>
                      </div>
                    )}
                    {r.status === "approved" && (
                      <button className={styles.btnReturn} onClick={() => handleReturn(r.id)}>Qaytarıldı</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminRentalsPage;
