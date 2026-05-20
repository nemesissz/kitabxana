import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import { useNavigate } from "react-router-dom";
import Footer from "../../Layouts/Footer";
import { ROLE_META } from "../../Constants/roles";

const STATUS_META = {
  approved: { label: "Təsdiqlənib", color: "#1a7a3a", bg: "#e8f8ee" },
  pending:  { label: "Gözləmədə",   color: "#b07d00", bg: "#fff8e1" },
  rejected: { label: "Rədd edilib", color: "#d32f2f", bg: "#fde8e8" },
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function formatJoinDate(d) {
  if (!d) return null;
  try {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  } catch { return null; }
}

function ProfilPage() {
  const store = useContext(dataContext);
  const user = store?.user.data;
  const navigate = useNavigate();

  const [tab, setTab] = useState("general");
  const [counts, setCounts] = useState({ reads: null, downloads: null, pdfs: null, rentals: null });

  const [myPdfs,      setMyPdfs]      = useState(null);
  const [myRentals,   setMyRentals]   = useState(null);
  const [myReads,     setMyReads]     = useState(null);
  const [myDownloads, setMyDownloads] = useState(null);

  const [institutions,  setInstitutions]  = useState([]);
  const [instRequestId, setInstRequestId] = useState("");
  const [instMsg,       setInstMsg]       = useState({ text: "", ok: false });
  const [instLoading,   setInstLoading]   = useState(false);

  const [loginForm,     setLoginForm]     = useState({ login: "" });
  const [loginMsg,      setLoginMsg]      = useState({ text: "", ok: false });
  const [showLoginForm, setShowLoginForm] = useState(false);

  const [passForm,     setPassForm]     = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passMsg,      setPassMsg]      = useState({ text: "", ok: false });
  const [showPassForm, setShowPassForm] = useState(false);

  // Auth guard
  useEffect(() => {
    document.title = "Profil — MMU Kitabxana";
    const token  = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) { store.user.setData(null); navigate("/login"); return; }
    axios
      .get(Base_Url_Server + "users/" + userID, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => store.user.setData(res.data.data.user))
      .catch((err) => {
        if (err.response?.status === 401) {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      });
  }, []);

  // Eager stat counts
  useEffect(() => {
    const token  = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) return;
    const h = { Authorization: `Bearer ${token}` };

    axios.get(`${Base_Url_Server}pdfs?submittedBy=${userID}&limit=1`, { headers: h })
      .then((r) => setCounts((c) => ({ ...c, pdfs: r.data.data.pagination?.total ?? 0 })))
      .catch(() => {});
    axios.get(`${Base_Url_Server}rentals/my`, { headers: h })
      .then((r) => setCounts((c) => ({ ...c, rentals: (r.data.data?.rentals || []).length })))
      .catch(() => {});
    axios.get(`${Base_Url_Server}pdfs/my-reads`, { headers: h })
      .then((r) => setCounts((c) => ({ ...c, reads: (r.data.data?.pdfs || []).length })))
      .catch(() => {});
    axios.get(`${Base_Url_Server}pdfs/my-downloads`, { headers: h })
      .then((r) => setCounts((c) => ({ ...c, downloads: (r.data.data?.pdfs || []).length })))
      .catch(() => {});
  }, [user?.id]);

  // Institution list for join-request
  useEffect(() => {
    if (user && !user.institutionId) {
      axios.get(Base_Url_Server + "institutions/public")
        .then((r) => setInstitutions(r.data.data.institutions || []))
        .catch(() => {});
    }
  }, [user?.institutionId]);

  // Lazy tab data
  useEffect(() => {
    const token  = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    if (tab === "pdfs" && myPdfs === null) {
      axios.get(`${Base_Url_Server}pdfs?submittedBy=${userID}&limit=100`, { headers: h })
        .then((r) => setMyPdfs(r.data.data.pdfs || []))
        .catch(() => setMyPdfs([]));
    }
    if (tab === "rentals" && myRentals === null) {
      axios.get(`${Base_Url_Server}rentals/my`, { headers: h })
        .then((r) => setMyRentals(r.data.data?.rentals || []))
        .catch(() => setMyRentals([]));
    }
    if (tab === "reads" && myReads === null) {
      axios.get(`${Base_Url_Server}pdfs/my-reads`, { headers: h })
        .then((r) => setMyReads(r.data.data?.pdfs || []))
        .catch(() => setMyReads([]));
    }
    if (tab === "downloads" && myDownloads === null) {
      axios.get(`${Base_Url_Server}pdfs/my-downloads`, { headers: h })
        .then((r) => setMyDownloads(r.data.data?.pdfs || []))
        .catch(() => setMyDownloads([]));
    }
  }, [tab]);

  const handleInstRequest = async (e) => {
    e.preventDefault();
    if (!instRequestId) return;
    setInstLoading(true);
    setInstMsg({ text: "", ok: false });
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${Base_Url_Server}institutions/${instRequestId}/join-request`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInstMsg({ text: "Sorğunuz göndərildi. Admin təsdiqləyəndən sonra üzv olacaqsınız.", ok: true });
      setInstRequestId("");
    } catch (err) {
      setInstMsg({ text: err.response?.data?.message || "Xəta baş verdi", ok: false });
    } finally {
      setInstLoading(false);
    }
  };

  const handleLoginChange = async (e) => {
    e.preventDefault();
    setLoginMsg({ text: "", ok: false });
    try {
      const token  = localStorage.getItem("token");
      const userID = localStorage.getItem("user");
      const res = await axios.patch(
        `${Base_Url_Server}users/${userID}`,
        { login: loginForm.login.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      store.user.setData(res.data.data.user);
      setLoginMsg({ text: "İstifadəçi adı yeniləndi.", ok: true });
      setShowLoginForm(false);
    } catch (err) {
      setLoginMsg({ text: err.response?.data?.message || "Xəta baş verdi", ok: false });
    }
  };

  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassMsg({ text: "", ok: false });
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ text: "Yeni şifrələr uyğun gəlmir", ok: false });
      return;
    }
    try {
      const token  = localStorage.getItem("token");
      const userID = localStorage.getItem("user");
      await axios.patch(
        `${Base_Url_Server}users/${userID}/password`,
        { oldPassword: passForm.oldPassword, newPassword: passForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPassMsg({ text: "Şifrə uğurla dəyişdirildi.", ok: true });
      setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPassForm(false);
    } catch (err) {
      setPassMsg({ text: err.response?.data?.message || "Xəta baş verdi", ok: false });
    }
  };

  const handleLogout = () => {
    store.user.setData(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("_sid");
    navigate("/login");
  };

  const roleMeta   = ROLE_META[user?.role] || ROLE_META[1];
  const joinDate   = formatJoinDate(user?.created_at);
  const displayName = user?.fullName || user?.login || "—";

  const TABS = [
    { key: "general",   label: "Ümumi",        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
    { key: "downloads", label: "Yükləmələrim", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, count: counts.downloads },
    { key: "reads",     label: "Oxuduqlarım",  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, count: counts.reads },
    { key: "rentals",   label: "Kirayələrim",  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, count: counts.rentals },
    { key: "settings",  label: "Tənzimləmələr", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
  ];

  return (
    <>
      <main>
        {/* ── Profile hero ── */}
        <section className={styles.hero}>
          <div className="mmu-container">
            <div className={styles.heroInner}>

              {/* Avatar */}
              <div className={styles.avatar}>
                {getInitials(displayName)}
              </div>

              {/* Info */}
              <div className={styles.heroInfo}>
                <span className={styles.roleEyebrow}>— {roleMeta.label}</span>
                <h1 className={styles.heroName}>{displayName}</h1>
                <div className={styles.heroMeta}>
                  <span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                    @{user?.login}
                  </span>
                  {user?.institutionName && (
                    <span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      {user.institutionName}
                    </span>
                  )}
                  {joinDate && (
                    <span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                      Üzv: {joinDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={styles.heroActions}>
                {user?.uploadPermission && user.uploadPermission !== "none" && (
                  <button className={styles.btnUpload} onClick={() => navigate("/library/submit")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9m0 0 5 5m-5-5-5 5"/><path d="M5 3h14"/></svg>
                    PDF Yüklə
                  </button>
                )}
                <button className={styles.btnEdit} onClick={() => setTab("settings")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Profilimi düzəlt
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* ── Stat cards ── */}
        <section className={styles.statSection}>
          <div className="mmu-container">
            <div className={styles.statGrid}>
              {[
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, n: counts.reads,     l: "Oxuduğum"    },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, n: counts.downloads, l: "Yüklədiyim"  },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, n: counts.pdfs,      l: "PDF-lərim"    },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, n: counts.rentals,   l: "Kirayələrim"  },
              ].map((s, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statIcon}>{s.icon}</div>
                  <div className={styles.statN}>{s.n ?? "—"}</div>
                  <div className={styles.statL}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tab bar ── */}
        <div className={styles.tabBar}>
          <div className="mmu-container">
            <div className={styles.tabs}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.icon}
                  {t.label}
                  {t.count != null && t.count !== "—" && (
                    <span className={styles.tabCount}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab content ── */}
        <section className={styles.tabSection}>
          <div className="mmu-container">

            {/* ── Ümumi ── */}
            {tab === "general" && (
              <div>
                {myPdfs === null ? (
                  (() => {
                    const token  = localStorage.getItem("token");
                    const userID = localStorage.getItem("user");
                    if (token && userID && myPdfs === null) {
                      axios.get(`${Base_Url_Server}pdfs?submittedBy=${userID}&limit=100`, { headers: { Authorization: `Bearer ${token}` } })
                        .then((r) => setMyPdfs(r.data.data.pdfs || []))
                        .catch(() => setMyPdfs([]));
                    }
                    return <div className={styles.loader}><div className={styles.spinner} /></div>;
                  })()
                ) : myPdfs.length === 0 ? (
                  <div className={styles.empty}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", margin: "0 auto 12px", display: "block" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p>Hələ PDF yükləməmisiniz</p>
                    {user?.uploadPermission && user.uploadPermission !== "none" && (
                      <button className="mmu-btn mmu-btn-primary mmu-btn-sm" onClick={() => navigate("/library/submit")}>PDF Yüklə</button>
                    )}
                  </div>
                ) : (
                  <div className={styles.pdfList}>
                    {myPdfs.map((pdf) => {
                      const st = STATUS_META[pdf.status] || STATUS_META.pending;
                      return (
                        <div key={pdf.id} className={styles.pdfRow} onClick={() => navigate(`/library/${pdf.id}`)}>
                          <div className={styles.pdfThumb}>
                            {pdf.cover_image_path || pdf.image_path ? (
                              <img src={formatServerFilePath(pdf.cover_image_path || pdf.image_path)} alt={pdf.title} onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            )}
                          </div>
                          <div className={styles.pdfInfo}>
                            <span className={styles.pdfTitle}>{pdf.title}</span>
                            <span className={styles.pdfMeta}>
                              {pdf.category?.name && <span>{pdf.category.name}</span>}
                              <span>{pdf.created_at?.split("T")[0]}</span>
                            </span>
                          </div>
                          <span className={styles.statusBadge} style={{ color: st.color, background: st.bg }}>{st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Yükləmələrim ── */}
            {tab === "downloads" && (
              <PdfListTab
                data={myDownloads}
                emptyText="Hələ heç bir PDF yükləməmisiniz"
                emptyIcon="download"
                navigate={navigate}
              />
            )}

            {/* ── Oxuduqlarım ── */}
            {tab === "reads" && (
              <PdfListTab
                data={myReads}
                emptyText="Hələ heç bir PDF oxumamısınız"
                emptyIcon="book"
                navigate={navigate}
              />
            )}

            {/* ── Kirayələrim ── */}
            {tab === "rentals" && (
              <div>
                {myRentals === null ? (
                  <div className={styles.loader}><div className={styles.spinner} /></div>
                ) : myRentals.length === 0 ? (
                  <div className={styles.empty}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", margin: "0 auto 12px", display: "block" }}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>
                    <p>Hələ kitab kirayələməmisiniz</p>
                  </div>
                ) : (
                  <div className={styles.pdfList}>
                    {myRentals.map((r) => {
                      const statusMap = {
                        pending:  { label: "Gözləyir",    color: "#92400e", bg: "#fef3c7" },
                        approved: { label: "Təsdiqlənib", color: "#166534", bg: "#dcfce7" },
                        rejected: { label: "Rədd edilib", color: "#dc2626", bg: "#fee2e2" },
                        returned: { label: "Qaytarılıb",  color: "#64748b", bg: "#f1f5f9" },
                      };
                      const st = statusMap[r.status] || statusMap.pending;
                      const endDate = r.end_date ? new Date(r.end_date) : null;
                      const daysLeft = endDate ? Math.ceil((endDate - new Date()) / (1000*60*60*24)) : null;
                      const isUrgent  = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
                      const isOverdue = daysLeft !== null && daysLeft < 0;
                      return (
                        <div key={r.id} className={styles.pdfRow} onClick={() => navigate(`/library/${r.pdf_id}`)}>
                          <div className={styles.pdfInfo}>
                            <span className={styles.pdfTitle}>{r.pdf_title}</span>
                            <span className={styles.pdfMeta}>
                              <span>{r.institution_name}</span>
                              <span>{r.duration_days} gün</span>
                              {r.end_date && r.status === "approved" && (
                                <span className={isOverdue ? styles.overdue : isUrgent ? styles.urgent : ""}>
                                  {isOverdue ? "⚠️ Gecikmiş!" : `Qaytarma: ${r.end_date.split("T")[0]} (${daysLeft} gün)`}
                                </span>
                              )}
                            </span>
                          </div>
                          <span className={styles.statusBadge} style={{ color: st.color, background: st.bg }}>{st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Tənzimləmələr ── */}
            {tab === "settings" && (
              <div className={styles.settingsGrid}>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>İstifadəçi adını dəyiş</h3>
                    <button className={styles.toggleBtn} onClick={() => { setShowLoginForm(v => !v); setLoginMsg({ text: "", ok: false }); }}>
                      {showLoginForm ? "Bağla" : "Dəyiş"}
                    </button>
                  </div>
                  <p className={styles.currentVal}>Cari: <strong>@{user?.login}</strong></p>
                  {showLoginForm && (
                    <form className={styles.form} onSubmit={handleLoginChange}>
                      <input className="mmu-input" type="text" placeholder="Yeni istifadəçi adı"
                        value={loginForm.login} onChange={(e) => setLoginForm({ login: e.target.value })} required minLength={3} />
                      {loginMsg.text && <p className={`${styles.msg} ${loginMsg.ok ? styles.msgOk : styles.msgErr}`}>{loginMsg.text}</p>}
                      <div className={styles.formActions}>
                        <button type="button" className="mmu-btn mmu-btn-outline mmu-btn-sm" onClick={() => setShowLoginForm(false)}>Ləğv et</button>
                        <button type="submit" className="mmu-btn mmu-btn-primary mmu-btn-sm">Yadda saxla</button>
                      </div>
                    </form>
                  )}
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>Şifrəni dəyiş</h3>
                    <button className={styles.toggleBtn} onClick={() => { setShowPassForm(v => !v); setPassMsg({ text: "", ok: false }); }}>
                      {showPassForm ? "Bağla" : "Dəyiş"}
                    </button>
                  </div>
                  {showPassForm && (
                    <form className={styles.form} onSubmit={handlePassChange}>
                      <input className="mmu-input" type="password" placeholder="Köhnə şifrə" value={passForm.oldPassword}
                        onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })} required />
                      <input className="mmu-input" type="password" placeholder="Yeni şifrə" value={passForm.newPassword}
                        onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} required />
                      <input className="mmu-input" type="password" placeholder="Yeni şifrəni təsdiqlə" value={passForm.confirmPassword}
                        onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} required />
                      {passMsg.text && <p className={`${styles.msg} ${passMsg.ok ? styles.msgOk : styles.msgErr}`}>{passMsg.text}</p>}
                      <div className={styles.formActions}>
                        <button type="button" className="mmu-btn mmu-btn-outline mmu-btn-sm" onClick={() => setShowPassForm(false)}>Ləğv et</button>
                        <button type="submit" className="mmu-btn mmu-btn-primary mmu-btn-sm">Yadda saxla</button>
                      </div>
                    </form>
                  )}
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}><h3>Müəssisə üzvlüyü</h3></div>
                  {user?.institutionId ? (
                    <p className={styles.currentVal}>Üzv olduğunuz müəssisə: <strong>{user.institutionName || `#${user.institutionId}`}</strong></p>
                  ) : (
                    <>
                      <p className={styles.currentVal} style={{ color: "var(--muted)" }}>Hər hansı bir müəssisəyə üzv deyilsiniz.</p>
                      {institutions.length > 0 && (
                        <form className={styles.form} onSubmit={handleInstRequest}>
                          <select className="mmu-input mmu-select" value={instRequestId}
                            onChange={(e) => { setInstRequestId(e.target.value); setInstMsg({ text: "", ok: false }); }}>
                            <option value="">— Müəssisə seçin —</option>
                            {institutions.map((inst) => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                          </select>
                          {instMsg.text && <p className={`${styles.msg} ${instMsg.ok ? styles.msgOk : styles.msgErr}`}>{instMsg.text}</p>}
                          {!instMsg.ok && (
                            <div className={styles.formActions}>
                              <button type="submit" className="mmu-btn mmu-btn-primary mmu-btn-sm" disabled={instLoading || !instRequestId}>
                                {instLoading ? "Göndərilir…" : "Sorğu göndər"}
                              </button>
                            </div>
                          )}
                        </form>
                      )}
                    </>
                  )}
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}><h3>Hesabdan çıxış</h3></div>
                  <p className={styles.currentVal} style={{ color: "var(--muted)" }}>Bütün cihazlarda seansınızı sonlandıracaq.</p>
                  <div className={styles.formActions} style={{ marginTop: 16 }}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Çıxış
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function PdfListTab({ data, emptyText, emptyIcon, navigate }) {
  if (data === null) return <div style={{ display:"flex", justifyContent:"center", padding:"80px 0" }}><div style={{ width:40, height:40, border:"3px solid var(--line)", borderTopColor:"var(--navy)", borderRadius:"50%", animation:"spin .7s linear infinite" }} /></div>;
  if (data.length === 0) return (
    <div style={{ textAlign:"center", padding:"80px 0", color:"var(--muted)", fontSize:15 }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color:"var(--muted)", margin:"0 auto 12px", display:"block" }}>
        {emptyIcon === "download" ? <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></> : <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>}
      </svg>
      <p>{emptyText}</p>
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {data.map((pdf) => (
        <div key={pdf.id}
          style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 18px", background:"var(--card)", border:"1px solid var(--line)", borderRadius:"var(--r-lg)", cursor:"pointer", boxShadow:"var(--shadow-sm)" }}
          onClick={() => navigate(`/library/${pdf.id}`)}
        >
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pdf.title}</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>
              {pdf.category_name && <span>{pdf.category_name} · </span>}
              {pdf.created_at?.split("T")[0]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProfilPage;
