import { useContext, useEffect, useState, useMemo } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import { useNavigate } from "react-router-dom";
import Footer from "../../Layouts/Footer";
import { getRoleBadge } from "../../Constants/roles";
import { displayCategoryName } from "../../Constants/categoryDisplay";

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

function getTimeAgo(d) {
  if (!d) return "";
  try {
    const ms = Date.now() - new Date(d).getTime();
    const h  = Math.floor(ms / (1000 * 60 * 60));
    const dy = Math.floor(h / 24);
    if (h < 1)  return "indi";
    if (h < 24) return `${h} saat əvvəl`;
    if (dy < 7) return `${dy} gün əvvəl`;
    if (dy < 30) return `${Math.floor(dy / 7)} həftə əvvəl`;
    return `${Math.floor(dy / 30)} ay əvvəl`;
  } catch { return ""; }
}

const PROGRESS_PCTS = [62, 45, 28];
const GOAL_TARGET   = 40;

/* ── SVG icons ── */
const IcoEye = ({ w = 18 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoDownload = ({ w = 18 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcoHeart = ({ w = 18 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcoCalendar = ({ w = 18 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const IcoUser = ({ w = 14 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IcoBuilding = ({ w = 14 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcoCheck = ({ w = 12 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoChevR = ({ w = 16 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoUpload = ({ w = 14 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21V9m0 0 5 5m-5-5-5 5"/><path d="M5 3h14"/>
  </svg>
);
const IcoEdit = ({ w = 14 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcoSettings = ({ w = 14 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoBook = ({ w = 18 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IcoFile = ({ w = 18 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IcoLogout = ({ w = 14 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ════════════════════════════════════════
   Main component
════════════════════════════════════════ */
function ProfilPage() {
  const store = useContext(dataContext);
  const user  = store?.user.data;
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [counts, setCounts] = useState({
    reads: null, downloads: null, pdfs: null, rentals: null, favorites: null,
  });

  const [myPdfs,      setMyPdfs]      = useState(null);
  const [myRentals,   setMyRentals]   = useState(null);
  const [myReads,     setMyReads]     = useState(null);
  const [myDownloads, setMyDownloads] = useState(null);
  const [myFavorites, setMyFavorites] = useState(null);

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

  /* ── Auth guard ── */
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

  /* ── Eager stat counts ── */
  useEffect(() => {
    const token  = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) return;
    const h = { Authorization: `Bearer ${token}` };

    axios.get(`${Base_Url_Server}pdfs?submittedBy=${userID}&limit=1`, { headers: h })
      .then(r  => setCounts(c => ({ ...c, pdfs:      r.data.data.pagination?.total ?? 0 })))
      .catch(() => {});
    axios.get(`${Base_Url_Server}rentals/my`, { headers: h })
      .then(r  => setCounts(c => ({ ...c, rentals:   (r.data.data?.rentals   || []).length })))
      .catch(() => {});
    axios.get(`${Base_Url_Server}pdfs/my-reads`, { headers: h })
      .then(r  => setCounts(c => ({ ...c, reads:     (r.data.data?.pdfs      || []).length })))
      .catch(() => {});
    axios.get(`${Base_Url_Server}pdfs/my-downloads`, { headers: h })
      .then(r  => setCounts(c => ({ ...c, downloads: (r.data.data?.pdfs      || []).length })))
      .catch(() => {});
    axios.get(`${Base_Url_Server}pdfs/my-favorites`, { headers: h })
      .then(r  => setCounts(c => ({ ...c, favorites: (r.data.data?.pdfs      || []).length })))
      .catch(() => setCounts(c => ({ ...c, favorites: 0 })));
  }, [user?.id]);

  /* ── Institution list ── */
  useEffect(() => {
    if (user && !user.institutionId) {
      axios.get(Base_Url_Server + "institutions/public")
        .then(r  => setInstitutions(r.data.data.institutions || []))
        .catch(() => {});
    }
  }, [user?.institutionId]);

  /* ── Lazy tab data ── */
  useEffect(() => {
    const token  = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    if (tab === "pdfs" && myPdfs === null) {
      axios.get(`${Base_Url_Server}pdfs?submittedBy=${userID}&limit=100`, { headers: h })
        .then(r  => setMyPdfs(r.data.data.pdfs || []))
        .catch(() => setMyPdfs([]));
    }
    if (tab === "rentals" && myRentals === null) {
      axios.get(`${Base_Url_Server}rentals/my`, { headers: h })
        .then(r  => setMyRentals(r.data.data?.rentals || []))
        .catch(() => setMyRentals([]));
    }
    if ((tab === "reads" || tab === "overview") && myReads === null) {
      axios.get(`${Base_Url_Server}pdfs/my-reads`, { headers: h })
        .then(r  => setMyReads(r.data.data?.pdfs || []))
        .catch(() => setMyReads([]));
    }
    if ((tab === "downloads" || tab === "overview") && myDownloads === null) {
      axios.get(`${Base_Url_Server}pdfs/my-downloads`, { headers: h })
        .then(r  => setMyDownloads(r.data.data?.pdfs || []))
        .catch(() => setMyDownloads([]));
    }
    if ((tab === "favorites" || tab === "overview") && myFavorites === null) {
      axios.get(`${Base_Url_Server}pdfs/my-favorites`, { headers: h })
        .then(r  => setMyFavorites(r.data.data?.pdfs || []))
        .catch(() => setMyFavorites([]));
    }
  }, [tab]);

  /* ── Settings handlers ── */
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

  /* ── Derived data ── */
  const activityItems = useMemo(() => {
    const reads = (myReads     || []).slice(0, 5).map(p => ({ type: "read",     pdf: p, when: p.last_read_at    || p.created_at }));
    const dls   = (myDownloads || []).slice(0, 5).map(p => ({ type: "download", pdf: p, when: p.downloaded_at   || p.created_at }));
    return [...reads, ...dls]
      .sort((a, b) => new Date(b.when) - new Date(a.when))
      .slice(0, 4);
  }, [myReads, myDownloads]);

  const roleMeta    = user ? getRoleBadge(user) : { label: "İstifadəçi", color: "#1565c0", bg: "#e3f2fd" };
  const joinDate    = formatJoinDate(user?.created_at);
  const displayName = user?.fullName || user?.login || "—";

  const readCount  = counts.reads  || 0;
  const goalPct    = Math.min(100, Math.round((readCount / GOAL_TARGET) * 100));
  const isGoalDone = readCount >= GOAL_TARGET;

  const achievements = [
    { l: "İlk oxu",    e: "📖", on: readCount >= 1  },
    { l: "5 favorit",  e: "❤️", on: (counts.favorites || 0) >= 5 },
    { l: "10 yükləmə", e: "📥", on: (counts.downloads || 0) >= 10 },
    { l: "1 ay aktiv", e: "🔥",
      on: !!user?.created_at && (Date.now() - new Date(user.created_at).getTime()) >= 30 * 24 * 60 * 60 * 1000 },
    { l: "Tövsiyəçi",  e: "⭐", on: readCount >= 20 },
    { l: "Magistr",    e: "🎓", on: !!user?.institutionId },
  ];

  const TABS = [
    { key: "overview",
      label: "Ümumi",
      icon: <IcoUser w={14} /> },
    { key: "favorites",
      label: "Favorilərim",
      icon: <IcoHeart w={14} />,
      count: counts.favorites },
    { key: "downloads",
      label: "Yükləmələrim",
      icon: <IcoDownload w={14} />,
      count: counts.downloads },
    { key: "reads",
      label: "Oxuduqlarım",
      icon: <IcoBook w={14} />,
      count: counts.reads },
    { key: "rentals",
      label: "Kirayələrim",
      icon: <IcoCalendar w={14} />,
      count: counts.rentals },
    ...(user?.uploadPermission && user.uploadPermission !== "none"
      ? [{ key: "pdfs", label: "PDF-lərim", icon: <IcoFile w={14} />, count: counts.pdfs }]
      : []),
    { key: "settings",
      label: "Tənzimləmələr",
      icon: <IcoSettings w={14} /> },
  ];

  return (
    <>
      <main>

        {/* ══ Profile hero ══ */}
        <section
          className={styles.hero}
          style={{ background: "linear-gradient(180deg, var(--accent-soft, #FFF4C2) 0%, transparent 100%)" }}
        >
          <div className="mmu-container">

            {/* Avatar + info + actions */}
            <div className={styles.heroInner}>
              <div className={styles.avatar}>{getInitials(displayName)}</div>

              <div className={styles.heroInfo}>
                <span className={styles.roleEyebrow}>— {roleMeta.label}</span>
                <h1 className={styles.heroName}>{displayName}</h1>
                <div className={styles.heroMeta}>
                  <span><IcoUser w={13} /> @{user?.login}</span>
                  {user?.institutionName && (
                    <span><IcoBuilding w={13} /> {user.institutionName}</span>
                  )}
                  {joinDate && (
                    <span>
                      <IcoCalendar w={13} />
                      Üzv: {joinDate}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.heroActions}>
                {user?.uploadPermission && user.uploadPermission !== "none" && (
                  <button className={styles.btnUpload} onClick={() => navigate("/library/submit")}>
                    <IcoUpload /> PDF Yüklə
                  </button>
                )}
                <button className={styles.btnEdit} onClick={() => setTab("settings")}>
                  <IcoEdit /> Profilimi düzəlt
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className={styles.statGrid}>
              {[
                { Icon: IcoEye,      n: counts.reads,     l: "Oxuduğum",      trend: counts.reads     },
                { Icon: IcoDownload, n: counts.downloads, l: "Yüklədiyim",    trend: counts.downloads },
                { Icon: IcoHeart,    n: counts.favorites, l: "Favoriydəki",   trend: counts.favorites },
                { Icon: IcoCalendar, n: counts.rentals,   l: "Kirayələdiyim", trend: counts.rentals   },
              ].map(({ Icon, n, l, trend }, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statTop}>
                    <div className={styles.statIcon}><Icon /></div>
                    {trend != null && trend > 0 && (
                      <span className={styles.statTrend}>↑ {trend}</span>
                    )}
                  </div>
                  <div className={styles.statN}>{n ?? "—"}</div>
                  <div className={styles.statL}>{l}</div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ══ Tab bar ══ */}
        <div className={styles.tabBar}>
          <div className="mmu-container">
            <div className={styles.tabs}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.icon}
                  {t.label}
                  {t.count != null && t.count > 0 && (
                    <span className={styles.tabCount}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ Tab content ══ */}
        <section className={styles.tabSection}>
          <div className="mmu-container">

            {/* ── Ümumi (overview) ── */}
            {tab === "overview" && (
              <div className={styles.overviewGrid}>

                {/* Main column */}
                <div className={styles.overviewMain}>

                  {/* Reading goal card */}
                  <div className={styles.goalCard}>
                    <div className={styles.goalTop}>
                      <div>
                        <div className={styles.goalEyebrow}>
                          ✨ 2026 oxu məqsədi
                        </div>
                        <h3 className={styles.goalTitle}>
                          {GOAL_TARGET} kitab oxumaq
                        </h3>
                      </div>
                      <div className={styles.goalNum}>
                        {readCount}<span>/{GOAL_TARGET}</span>
                      </div>
                    </div>
                    <div className={styles.goalBar}>
                      <div className={styles.goalBarFill} style={{ width: `${goalPct}%` }} />
                    </div>
                    <div className={styles.goalMsg}>
                      {readCount === 0
                        ? "📚 Oxumağa başlayın, hər kitab sizi daha da gücləndirir!"
                        : isGoalDone
                        ? `🎉 Məqsədinizi ${goalPct - 100}% artıq icra etmisiniz. Növbəti məqsəd: ${GOAL_TARGET + 10} kitab.`
                        : `📚 ${GOAL_TARGET - readCount} kitab qalır (${goalPct}%). Davam edin!`}
                    </div>
                  </div>

                  {/* Recent activity */}
                  <div>
                    <div className={styles.sectionHead}>
                      <h2>Son fəaliyyət</h2>
                      <button className={styles.btnGhost} onClick={() => setTab("reads")}>
                        Hamısı
                      </button>
                    </div>
                    {myReads === null && myDownloads === null ? (
                      <div className={styles.loader}><div className={styles.spinner} /></div>
                    ) : activityItems.length === 0 ? (
                      <div className={styles.activityCard}>
                        <p style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)", fontSize: 14, margin: 0 }}>
                          Hələ heç bir fəaliyyət yoxdur
                        </p>
                      </div>
                    ) : (
                      <div className={styles.activityCard}>
                        {activityItems.map((a, i) => (
                          <div
                            key={i}
                            className={styles.activityItem}
                            onClick={() => navigate(`/library/${a.pdf.id}`)}
                          >
                            <div className={styles.activityIcon}>
                              {a.type === "read"
                                ? <IcoEye w={18} />
                                : <IcoDownload w={18} />}
                            </div>
                            <div className={styles.activityInfo}>
                              <div className={styles.activityTitle}>
                                <b>{a.pdf.title}</b>{" "}
                                {a.type === "read" ? "oxudu" : "yüklədi"}
                              </div>
                              <div className={styles.activityMeta}>
                                {getTimeAgo(a.when)}{a.pdf.author_name ? ` · ${a.pdf.author_name}` : ""}
                              </div>
                            </div>
                            <IcoChevR />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Davam et (Continue reading) */}
                  {myReads !== null && myReads.length > 0 && (
                    <div>
                      <div className={styles.sectionHead}>
                        <h2>Davam et</h2>
                      </div>
                      <div className={styles.continueGrid}>
                        {myReads.slice(0, 3).map((pdf, i) => {
                          const pct = PROGRESS_PCTS[i] || 30;
                          const cover = pdf.cover_image_path || pdf.image_path;
                          return (
                            <div
                              key={pdf.id}
                              className={styles.continueCard}
                              onClick={() => navigate(`/library/${pdf.id}`)}
                            >
                              <div
                                className={styles.continueCover}
                                style={{ background: `linear-gradient(135deg, var(--navy) 0%, #2a3f66 100%)` }}
                              >
                                <div className={styles.continueCoverBook}>
                                  {cover ? (
                                    <img
                                      src={formatServerFilePath(cover)}
                                      alt={pdf.title}
                                      onError={e => { e.target.style.display = "none"; }}
                                    />
                                  ) : (
                                    <IcoBook w={28} style={{ color: "rgba(255,255,255,.5)" }} />
                                  )}
                                </div>
                              </div>
                              <div className={styles.continueBody}>
                                <div className={styles.continuePercent}>{pct}% oxudum</div>
                                <div className={styles.continueBar}>
                                  <div className={styles.continueBarFill} style={{ width: `${pct}%` }} />
                                </div>
                                <div className={styles.continueTitle}>{pdf.title}</div>
                                <div className={styles.continueAuthor}>
                                  {pdf.author_name || pdf.author || "—"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>{/* /overviewMain */}

                {/* Right sidebar */}
                <aside className={styles.overviewAside}>

                  {/* Institution card */}
                  <div className={styles.sidebarCard}>
                    <h3 className={styles.sidebarCardTitle}>Müəssisə üzvlüyü</h3>
                    {user?.institutionId ? (
                      <div className={styles.instRow}>
                        <div className={styles.instIconWrap}>
                          <IcoBuilding w={22} />
                        </div>
                        <div>
                          <div className={styles.instName}>
                            {user.institutionName || `#${user.institutionId}`}
                          </div>
                          <div className={styles.instStatus}>
                            <IcoCheck w={12} /> Aktiv üzvlük
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                        Hər hansı müəssisəyə üzv deyilsiniz.
                      </p>
                    )}
                  </div>

                  {/* Achievements */}
                  <div className={styles.sidebarCard}>
                    <h3 className={styles.sidebarCardTitle}>Nailiyyətlər</h3>
                    <div className={styles.achieveGrid}>
                      {achievements.map((a, i) => (
                        <div
                          key={i}
                          className={`${styles.achieveItem} ${a.on ? "" : styles.achieveItemOff}`}
                        >
                          <div className={styles.achieveEmoji}
                            style={{ filter: a.on ? "none" : "grayscale(1)" }}
                          >
                            {a.e}
                          </div>
                          <div className={styles.achieveLabel}>{a.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Favorites teaser (shows real favorites if available, else recent reads) */}
                  {(() => {
                    const items = myFavorites?.length > 0
                      ? myFavorites
                      : myReads?.length > 0
                      ? myReads
                      : null;
                    const label = myFavorites?.length > 0 ? "Favorilərim" : "Son oxuduqlarım";
                    const count = myFavorites?.length > 0 ? myFavorites.length : myReads?.length;
                    if (!items) return null;
                    return (
                      <div className={styles.sidebarCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                          <h3 className={styles.sidebarCardTitle} style={{ margin: 0 }}>{label}</h3>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>{count}</span>
                        </div>
                        {items.slice(0, 4).map(pdf => {
                          const cover = pdf.cover_image_path || pdf.image_path;
                          return (
                            <div
                              key={pdf.id}
                              className={styles.favTeaserItem}
                              onClick={() => navigate(`/library/${pdf.id}`)}
                            >
                              <div className={styles.favTeaserCover}>
                                {cover && (
                                  <img
                                    src={formatServerFilePath(cover)}
                                    alt={pdf.title}
                                    onError={e => { e.target.style.display = "none"; }}
                                  />
                                )}
                              </div>
                              <div className={styles.favTeaserInfo}>
                                <div className={styles.favTeaserTitle}>{pdf.title}</div>
                                <div className={styles.favTeaserAuthor}>
                                  {pdf.author_name || pdf.author || "—"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                </aside>

              </div>
            )}

            {/* ── Favorilərim ── */}
            {tab === "favorites" && (
              myFavorites === null ? (
                <div className={styles.loader}><div className={styles.spinner} /></div>
              ) : myFavorites.length === 0 ? (
                <div className={styles.empty}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "var(--accent-soft, #FFF4C2)",
                    color: "var(--navy)",
                    display: "grid", placeItems: "center",
                    margin: "0 auto 16px",
                  }}>
                    <IcoHeart w={24} />
                  </div>
                  <p>Hələ favoriyə kitab əlavə etməmisiniz</p>
                  <button className="mmu-btn mmu-btn-primary mmu-btn-sm" onClick={() => navigate("/library")}>
                    Kitabxanaya get
                  </button>
                </div>
              ) : (
                <div className={styles.favGrid}>
                  {myFavorites.map(pdf => (
                    <div
                      key={pdf.id}
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--line)",
                        borderRadius: "var(--r-lg)",
                        overflow: "hidden",
                        cursor: "pointer",
                        boxShadow: "var(--shadow-sm)",
                        transition: "transform .15s, box-shadow .15s",
                      }}
                      onClick={() => navigate(`/library/${pdf.id}`)}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                    >
                      <div style={{
                        height: 180,
                        background: "linear-gradient(135deg, var(--navy) 0%, #2a3f66 100%)",
                        display: "grid", placeItems: "center",
                      }}>
                        {(pdf.cover_image_path || pdf.image_path) ? (
                          <img
                            src={formatServerFilePath(pdf.cover_image_path || pdf.image_path)}
                            alt={pdf.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={e => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <IcoBook w={40} style={{ color: "rgba(255,255,255,.4)" }} />
                        )}
                      </div>
                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500, marginBottom: 4, color: "var(--ink)" }}>
                          {pdf.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {pdf.author_name || pdf.author || "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
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
              myReads === null ? (
                <div className={styles.loader}><div className={styles.spinner} /></div>
              ) : myReads.length === 0 ? (
                <div className={styles.empty}>
                  <IcoBook w={48} style={{ color: "var(--muted)", margin: "0 auto 12px", display: "block" }} />
                  <p>Hələ heç bir PDF oxumamısınız</p>
                </div>
              ) : (
                <div className={styles.readingList}>
                  {myReads.map((pdf, i) => {
                    const pct   = PROGRESS_PCTS[i % PROGRESS_PCTS.length] || 30;
                    const cover = pdf.cover_image_path || pdf.image_path;
                    return (
                      <div
                        key={pdf.id}
                        className={styles.readingListItem}
                        onClick={() => navigate(`/library/${pdf.id}`)}
                      >
                        <div className={styles.readingListCover}>
                          {cover ? (
                            <img src={formatServerFilePath(cover)} alt={pdf.title}
                              onError={e => { e.target.style.display = "none"; }} />
                          ) : (
                            <IcoBook w={20} style={{ color: "var(--navy)", opacity: .6 }} />
                          )}
                        </div>
                        <div className={styles.readingListInfo}>
                          <div className={styles.readingListTitle}>{pdf.title}</div>
                          <div className={styles.readingListMeta}>
                            {pdf.author_name || pdf.author || "—"}
                            {pdf.category_name ? ` · ${displayCategoryName(pdf.category_name)}` : ""}
                          </div>
                          <div className={styles.readingListBar}>
                            <div className={styles.readingListBarTrack}>
                              <div className={styles.readingListBarFill} style={{ width: `${pct}%` }} />
                            </div>
                            <span className={styles.readingListPct}>{pct}%</span>
                          </div>
                        </div>
                        <button
                          className={styles.continueBtn}
                          onClick={e => { e.stopPropagation(); navigate(`/library/${pdf.id}`); }}
                        >
                          Davam et
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ── Kirayələrim ── */}
            {tab === "rentals" && (
              myRentals === null ? (
                <div className={styles.loader}><div className={styles.spinner} /></div>
              ) : myRentals.length === 0 ? (
                <div className={styles.empty}>
                  <IcoCalendar w={48} style={{ color: "var(--muted)", margin: "0 auto 12px", display: "block" }} />
                  <p>Hələ kitab kirayələməmisiniz</p>
                </div>
              ) : (
                <div className={styles.pdfList}>
                  {myRentals.map(r => {
                    const statusMap = {
                      pending:  { label: "Gözləyir",    color: "#92400e", bg: "#fef3c7" },
                      approved: { label: "Təsdiqlənib", color: "#166534", bg: "#dcfce7" },
                      rejected: { label: "Rədd edilib", color: "#dc2626", bg: "#fee2e2" },
                      returned: { label: "Qaytarılıb",  color: "#64748b", bg: "#f1f5f9" },
                    };
                    const st       = statusMap[r.status] || statusMap.pending;
                    const endDate  = r.end_date ? new Date(r.end_date) : null;
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
                                {isOverdue
                                  ? "⚠️ Gecikmiş!"
                                  : `Qaytarma: ${r.end_date.split("T")[0]} (${daysLeft} gün)`}
                              </span>
                            )}
                          </span>
                        </div>
                        <span className={styles.statusBadge}
                          style={{ color: st.color, background: st.bg }}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ── PDF-lərim (uploaded) ── */}
            {tab === "pdfs" && (
              myPdfs === null ? (
                <div className={styles.loader}><div className={styles.spinner} /></div>
              ) : myPdfs.length === 0 ? (
                <div className={styles.empty}>
                  <IcoFile w={48} style={{ color: "var(--muted)", margin: "0 auto 12px", display: "block" }} />
                  <p>Hələ PDF yükləməmisiniz</p>
                  {user?.uploadPermission && user.uploadPermission !== "none" && (
                    <button className="mmu-btn mmu-btn-primary mmu-btn-sm"
                      onClick={() => navigate("/library/submit")}>PDF Yüklə</button>
                  )}
                </div>
              ) : (
                <div className={styles.pdfList}>
                  {myPdfs.map(pdf => {
                    const st = STATUS_META[pdf.status] || STATUS_META.pending;
                    return (
                      <div key={pdf.id} className={styles.pdfRow}
                        onClick={() => navigate(`/library/${pdf.id}`)}>
                        <div className={styles.pdfThumb}>
                          {(pdf.cover_image_path || pdf.image_path) ? (
                            <img src={formatServerFilePath(pdf.cover_image_path || pdf.image_path)}
                              alt={pdf.title} onError={e => { e.target.style.display = "none"; }} />
                          ) : (
                            <IcoFile w={22} style={{ color: "var(--navy)" }} />
                          )}
                        </div>
                        <div className={styles.pdfInfo}>
                          <span className={styles.pdfTitle}>{pdf.title}</span>
                          <span className={styles.pdfMeta}>
                            {pdf.category?.name && <span>{displayCategoryName(pdf.category.name)}</span>}
                            <span>{pdf.created_at?.split("T")[0]}</span>
                          </span>
                        </div>
                        <span className={styles.statusBadge}
                          style={{ color: st.color, background: st.bg }}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ── Tənzimləmələr ── */}
            {tab === "settings" && (
              <div className={styles.settingsGrid}>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>İstifadəçi adını dəyiş</h3>
                    <button className={styles.toggleBtn}
                      onClick={() => { setShowLoginForm(v => !v); setLoginMsg({ text: "", ok: false }); }}>
                      {showLoginForm ? "Bağla" : "Dəyiş"}
                    </button>
                  </div>
                  <p className={styles.currentVal}>Cari: <strong>@{user?.login}</strong></p>
                  {showLoginForm && (
                    <form className={styles.form} onSubmit={handleLoginChange}>
                      <input className="mmu-input" type="text" placeholder="Yeni istifadəçi adı"
                        value={loginForm.login}
                        onChange={e => setLoginForm({ login: e.target.value })}
                        required minLength={3} />
                      {loginMsg.text && (
                        <p className={`${styles.msg} ${loginMsg.ok ? styles.msgOk : styles.msgErr}`}>
                          {loginMsg.text}
                        </p>
                      )}
                      <div className={styles.formActions}>
                        <button type="button" className="mmu-btn mmu-btn-outline mmu-btn-sm"
                          onClick={() => setShowLoginForm(false)}>Ləğv et</button>
                        <button type="submit" className="mmu-btn mmu-btn-primary mmu-btn-sm">Yadda saxla</button>
                      </div>
                    </form>
                  )}
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}>
                    <h3>Şifrəni dəyiş</h3>
                    <button className={styles.toggleBtn}
                      onClick={() => { setShowPassForm(v => !v); setPassMsg({ text: "", ok: false }); }}>
                      {showPassForm ? "Bağla" : "Dəyiş"}
                    </button>
                  </div>
                  {showPassForm && (
                    <form className={styles.form} onSubmit={handlePassChange}>
                      <input className="mmu-input" type="password" placeholder="Köhnə şifrə"
                        value={passForm.oldPassword}
                        onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })} required />
                      <input className="mmu-input" type="password" placeholder="Yeni şifrə"
                        value={passForm.newPassword}
                        onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} required />
                      <input className="mmu-input" type="password" placeholder="Yeni şifrəni təsdiqlə"
                        value={passForm.confirmPassword}
                        onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} required />
                      {passMsg.text && (
                        <p className={`${styles.msg} ${passMsg.ok ? styles.msgOk : styles.msgErr}`}>
                          {passMsg.text}
                        </p>
                      )}
                      <div className={styles.formActions}>
                        <button type="button" className="mmu-btn mmu-btn-outline mmu-btn-sm"
                          onClick={() => setShowPassForm(false)}>Ləğv et</button>
                        <button type="submit" className="mmu-btn mmu-btn-primary mmu-btn-sm">Yadda saxla</button>
                      </div>
                    </form>
                  )}
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHead}><h3>Müəssisə üzvlüyü</h3></div>
                  {user?.institutionId ? (
                    <p className={styles.currentVal}>
                      Üzv olduğunuz müəssisə: <strong>{user.institutionName || `#${user.institutionId}`}</strong>
                    </p>
                  ) : (
                    <>
                      <p className={styles.currentVal} style={{ color: "var(--muted)" }}>
                        Hər hansı bir müəssisəyə üzv deyilsiniz.
                      </p>
                      {institutions.length > 0 && (
                        <form className={styles.form} onSubmit={handleInstRequest}>
                          <select className="mmu-input mmu-select" value={instRequestId}
                            onChange={e => { setInstRequestId(e.target.value); setInstMsg({ text: "", ok: false }); }}>
                            <option value="">— Müəssisə seçin —</option>
                            {institutions.map(inst => (
                              <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                          </select>
                          {instMsg.text && (
                            <p className={`${styles.msg} ${instMsg.ok ? styles.msgOk : styles.msgErr}`}>
                              {instMsg.text}
                            </p>
                          )}
                          {!instMsg.ok && (
                            <div className={styles.formActions}>
                              <button type="submit" className="mmu-btn mmu-btn-primary mmu-btn-sm"
                                disabled={instLoading || !instRequestId}>
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
                  <p className={styles.currentVal} style={{ color: "var(--muted)" }}>
                    Bütün cihazlarda seansınızı sonlandıracaq.
                  </p>
                  <div className={styles.formActions} style={{ marginTop: 16 }}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                      <IcoLogout /> Çıxış
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

/* ── PdfListTab helper ── */
function PdfListTab({ data, emptyText, emptyIcon, navigate }) {
  if (data === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <div style={{
          width: 40, height: 40,
          border: "3px solid var(--line)", borderTopColor: "var(--navy)",
          borderRadius: "50%", animation: "spin .7s linear infinite",
        }} />
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: "var(--muted)", fontSize: 15 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ color: "var(--muted)", margin: "0 auto 12px", display: "block" }}>
          {emptyIcon === "download"
            ? <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>
            : <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>}
        </svg>
        <p>{emptyText}</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map(pdf => (
        <div key={pdf.id}
          style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "14px 18px",
            background: "var(--card)", border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)", cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "border-color .15s, box-shadow .15s",
          }}
          onClick={() => navigate(`/library/${pdf.id}`)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--navy)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {pdf.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
              {pdf.category_name && <span>{displayCategoryName(pdf.category_name)} · </span>}
              {pdf.created_at?.split("T")[0]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProfilPage;
