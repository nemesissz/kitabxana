import { useContext, useEffect, useState, useRef } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const STATUS_LABELS = {
  pending:  { label: "Gözləyən",       cls: "pending"  },
  approved: { label: "Aktiv",          cls: "approved" },
  rejected: { label: "Rədd edilmiş",   cls: "rejected" },
  returned: { label: "Qaytarılmış",    cls: "returned" },
};

const EMPTY_FORM = { pdf: null, user_id: "", end_date: "", notes: "" };

function AdminRentalsPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const tokenAdmin = localStorage.getItem("tokenAdmin");

  const [rentals, setRentals]   = useState([]);
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);

  // New rental modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  // Book search
  const [bookSearch, setBookSearch]       = useState("");
  const [bookResults, setBookResults]     = useState([]);
  const [bookSearching, setBookSearching] = useState(false);
  const bookDebounce = useRef(null);

  // Users list
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userDropOpen, setUserDropOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!tokenAdmin) { navigate("/admin/login"); return; }
    fetchRentals();
    axios.get(Base_Url_Server + "users", { headers: { Authorization: `Bearer ${tokenAdmin}` } })
      .then(r => setUsers(r.data.data.users || []))
      .catch(() => {});
  }, [tokenAdmin]);

  const fetchRentals = () => {
    setLoading(true);
    axios.get(Base_Url_Server + "rentals", { headers: { Authorization: `Bearer ${tokenAdmin}` } })
      .then(r => setRentals(r.data.data.rentals || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const refreshNotifications = () => {
    axios.get(`${Base_Url_Server}admin/pending-counts`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then(r => store.adminNotifications.setData(r.data.data)).catch(() => {});
  };

  // Book search debounce — only physical types
  const handleBookSearch = (val) => {
    setBookSearch(val);
    form.pdf && setForm(f => ({ ...f, pdf: null }));
    clearTimeout(bookDebounce.current);
    if (!val.trim()) { setBookResults([]); return; }
    bookDebounce.current = setTimeout(async () => {
      setBookSearching(true);
      try {
        const r = await axios.get(Base_Url_Server + "pdfs", {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
          params: { search: val.trim(), status: "approved", limit: 20, adminView: 1 },
        });
        const all = r.data.data.pdfs || [];
        // Yalnız fiziki tipli (çap olan)
        const physical = all.filter(p => {
          const t = (p.pdf_type?.name || "").toLowerCase();
          return t.includes("çap");
        });
        setBookResults(physical);
      } catch { setBookResults([]); }
      finally { setBookSearching(false); }
    }, 350);
  };

  const selectBook = (pdf) => {
    setForm(f => ({ ...f, pdf }));
    setBookSearch(pdf.title);
    setBookResults([]);
  };

  const handleReturn = async (id) => {
    try {
      await axios.patch(Base_Url_Server + `rentals/${id}/return`, {}, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      fetchRentals();
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Xəta baş verdi", "error");
    }
  };

  const handleSave = async () => {
    if (!form.pdf) return Swal.fire("Xəta", "Kitab seçilməyib", "error");
    if (!form.user_id) return Swal.fire("Xəta", "İstifadəçi seçilməyib", "error");
    if (!form.end_date) return Swal.fire("Xəta", "Qaytarma tarixi seçilməyib", "error");
    setSaving(true);
    try {
      await axios.post(Base_Url_Server + "rentals/admin", {
        pdf_id:   form.pdf.id,
        user_id:  Number(form.user_id),
        end_date: form.end_date,
        notes:    form.notes || null,
      }, { headers: { Authorization: `Bearer ${tokenAdmin}` } });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setBookSearch("");
      fetchRentals();
      refreshNotifications();
      Swal.fire({ icon: "success", title: "Qeydiyyat edildi!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Saxlanmadı", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = filter === "all" ? rentals : rentals.filter(r => r.status === filter);

  const filteredUsers = userSearch.trim()
    ? users.filter(u =>
        (u.login || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Kitab Kirayəsi</h2>
        <button className={styles.newBtn} onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setBookSearch(""); setBookResults([]); setUserSearch(""); setSelectedUser(null); setUserDropOpen(false); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Yeni Kirayə
        </button>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        {["all", "approved", "returned", "pending", "rejected"].map(s => (
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
        <p className={styles.emptyMsg}>Qeydiyyat yoxdur.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>İstifadəçi</th>
                <th>Kitab</th>
                <th>Müəssisə</th>
                <th>Başlama</th>
                <th>Qaytarma</th>
                <th>Status</th>
                <th>Qeyd</th>
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
                  <td className={styles.dateCell}>{r.start_date?.split("T")[0] || "—"}</td>
                  <td className={styles.dateCell}>
                    {r.end_date ? (() => {
                      const daysLeft = Math.ceil((new Date(r.end_date) - new Date()) / (1000*60*60*24));
                      const isOverdue = r.status === "approved" && daysLeft < 0;
                      const isUrgent  = r.status === "approved" && daysLeft >= 0 && daysLeft <= 3;
                      return (
                        <span style={isOverdue ? { color: "#dc2626", fontWeight: 700 } : isUrgent ? { color: "#d97706", fontWeight: 700 } : {}}>
                          {r.end_date.split("T")[0]}
                          {isOverdue && " ⚠️"}
                        </span>
                      );
                    })() : "—"}
                  </td>
                  <td>
                    <span className={`${styles.chip} ${styles[STATUS_LABELS[r.status]?.cls]}`}>
                      {STATUS_LABELS[r.status]?.label || r.status}
                    </span>
                  </td>
                  <td className={styles.notesCell}>{r.notes || "—"}</td>
                  <td>
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

      {/* New rental modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>Yeni Kirayə Qeydiyyatı</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {/* Book search */}
              <div className={styles.field}>
                <label>Kitab <span>*</span></label>
                <div className={styles.searchWrap}>
                  <input
                    type="text"
                    placeholder="Kitab adını yazın (yalnız çap növləri)..."
                    value={bookSearch}
                    onChange={e => handleBookSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {bookSearching && <span className={styles.searching}>Axtarılır...</span>}
                  {bookResults.length > 0 && (
                    <div className={styles.dropdown}>
                      {bookResults.map(p => {
                        const total  = parseInt(p.quantity) || 1;
                        const rented = parseInt(p.active_rentals_count) || 0;
                        const avail  = total - rented;
                        return (
                          <div
                            key={p.id}
                            className={`${styles.dropItem} ${avail <= 0 ? styles.dropItemDisabled : ""}`}
                            onClick={() => avail > 0 && selectBook(p)}
                          >
                            <span className={styles.dropTitle}>{p.title}</span>
                            <span className={styles.dropMeta}>
                              {p.pdf_type?.name} · {avail}/{total} mövcud
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {form.pdf && (
                  <div className={styles.selectedBook}>
                    <span>✓ {form.pdf.title}</span>
                    <button type="button" onClick={() => { setForm(f => ({ ...f, pdf: null })); setBookSearch(""); }}>✕</button>
                  </div>
                )}
              </div>

              {/* User select */}
              <div className={styles.field}>
                <label>İstifadəçi <span>*</span></label>
                <div className={styles.searchWrap}>
                  <input
                    type="text"
                    placeholder="Ad və ya e-poçt ilə axtar..."
                    value={userSearch}
                    autoComplete="off"
                    onFocus={() => setUserDropOpen(true)}
                    onChange={e => {
                      setUserSearch(e.target.value);
                      setUserDropOpen(true);
                      if (selectedUser) { setSelectedUser(null); setForm(f => ({ ...f, user_id: "" })); }
                    }}
                  />
                  {userDropOpen && filteredUsers.length > 0 && (
                    <div className={styles.dropdown}>
                      {filteredUsers.slice(0, 30).map(u => (
                        <div
                          key={u.id}
                          className={styles.dropItem}
                          onMouseDown={e => {
                            e.preventDefault();
                            setSelectedUser(u);
                            setForm(f => ({ ...f, user_id: String(u.id) }));
                            setUserSearch(u.login || u.email || "");
                            setUserDropOpen(false);
                          }}
                        >
                          <span className={styles.dropTitle}>{u.login || u.email}</span>
                          {u.login && u.email && u.login !== u.email && (
                            <span className={styles.dropMeta}>{u.email}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <div className={styles.selectedBook}>
                    <span>✓ {selectedUser.login || selectedUser.email}</span>
                    <button type="button" onClick={() => { setSelectedUser(null); setForm(f => ({ ...f, user_id: "" })); setUserSearch(""); }}>✕</button>
                  </div>
                )}
              </div>

              {/* Return date */}
              <div className={styles.field}>
                <label>Qaytarma tarixi <span>*</span></label>
                <input
                  type="date"
                  min={today}
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>

              {/* Notes */}
              <div className={styles.field}>
                <label>Qeyd <span className={styles.optional}>(istəyə bağlı)</span></label>
                <textarea
                  rows={3}
                  placeholder="Şəxsiyyət vəsiqəsi №, FIN, əlaqə..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.modalFoot}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Ləğv et</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Saxlanır..." : "Qeydiyyat et"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRentalsPage;
