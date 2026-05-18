import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import { useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import BusinessIcon from "@mui/icons-material/Business";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import CircularProgress from "@mui/material/CircularProgress";
import Footer from "../../Layouts/Footer";
import bgImage from "../../Assets/heroImage.jpg";
import { ROLE_META } from "../../Constants/roles";

const PERMISSION_META = {
  free:    { label: "Töhfəçi",  color: "#1a7a3a", bg: "#e8f8ee" },
  pending: { label: "Gözləmədə", color: "#b07d00", bg: "#fff8e1" },
  none:    { label: "Oxuyucu",  color: "#888",    bg: "#f0f0f0" },
};

const STATUS_META = {
  approved: { label: "Təsdiqlənib", color: "#1a7a3a", bg: "#e8f8ee" },
  pending:  { label: "Gözləmədə",   color: "#b07d00", bg: "#fff8e1" },
  rejected: { label: "Rədd edilib", color: "#d32f2f", bg: "#fde8e8" },
};

function ProfilPage() {
  const store = useContext(dataContext);
  const user = store?.user.data;
  const navigate = useNavigate();

  const [tab, setTab] = useState("info");

  const [loginForm, setLoginForm] = useState({ login: "" });
  const [loginMsg, setLoginMsg] = useState({ text: "", ok: false });
  const [showLoginForm, setShowLoginForm] = useState(false);

  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passMsg, setPassMsg] = useState({ text: "", ok: false });
  const [showPassForm, setShowPassForm] = useState(false);

  const [myPdfs, setMyPdfs] = useState(null);
  const [myRentals, setMyRentals] = useState(null);
  const [myReads, setMyReads] = useState(null);
  const [myDownloads, setMyDownloads] = useState(null);

  const [institutions, setInstitutions] = useState([]);
  const [instRequestId, setInstRequestId] = useState("");
  const [instMsg, setInstMsg] = useState({ text: "", ok: false });
  const [instLoading, setInstLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) { store.user.setData(null); navigate("/login"); return; }
    axios
      .get(Base_Url_Server + "users/" + userID, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => store.user.setData(res.data.data.user))
      .catch((error) => {
        if (error.response?.status === 401) {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      });
  }, []);

  useEffect(() => {
    if (user && !user.institutionId) {
      axios.get(Base_Url_Server + "institutions/public")
        .then((r) => setInstitutions(r.data.data.institutions || []))
        .catch(() => {});
    }
  }, [user?.institutionId]);

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (tab === "pdfs" && myPdfs === null) {
      axios.get(`${Base_Url_Server}pdfs?submittedBy=${userID}&limit=100`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setMyPdfs(res.data.data.pdfs || []))
        .catch(() => setMyPdfs([]));
    }
    if (tab === "rentals" && myRentals === null) {
      axios.get(`${Base_Url_Server}rentals/my`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setMyRentals(res.data.data?.rentals || []))
        .catch(() => setMyRentals([]));
    }
    if (tab === "reads" && myReads === null) {
      axios.get(`${Base_Url_Server}pdfs/my-reads`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setMyReads(res.data.data?.pdfs || []))
        .catch(() => setMyReads([]));
    }
    if (tab === "downloads" && myDownloads === null) {
      axios.get(`${Base_Url_Server}pdfs/my-downloads`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setMyDownloads(res.data.data?.pdfs || []))
        .catch(() => setMyDownloads([]));
    }
  }, [tab]);

  const handleLogout = () => {
    store.user.setData(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleLoginChange = async (e) => {
    e.preventDefault();
    setLoginMsg({ text: "", ok: false });
    try {
      const token = localStorage.getItem("token");
      const userID = localStorage.getItem("user");
      const res = await axios.patch(
        `${Base_Url_Server}users/${userID}`,
        { login: loginForm.login.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      store.user.setData(res.data.data.user || { ...user, login: loginForm.login.trim() });
      setLoginMsg({ text: "İstifadəçi adı uğurla dəyişdirildi", ok: true });
      setShowLoginForm(false);
      setLoginForm({ login: "" });
    } catch (err) {
      setLoginMsg({ text: err.response?.data?.message || "Xəta baş verdi", ok: false });
    }
  };

  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassMsg({ text: "", ok: false });
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ text: "Yeni şifrələr uyğun deyil!", ok: false });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const userID = localStorage.getItem("user");
      await axios.patch(
        `${Base_Url_Server}users/${userID}`,
        { password: passForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPassMsg({ text: "Şifrə uğurla dəyişdirildi", ok: true });
      setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPassForm(false);
    } catch (err) {
      setPassMsg({ text: err.response?.data?.message || "Xəta baş verdi", ok: false });
    }
  };

  const perm = PERMISSION_META[user?.uploadPermission] || PERMISSION_META.none;
  const roleMeta = ROLE_META[user?.role] || ROLE_META[1];

  return (
    <>
      <div className={styles.page}>

        {/* ── Hero banner ── */}
        <div className={styles.hero}>
          <img src={bgImage} alt="profil arxa fon" className={styles.heroBg} />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarCircle}>
                <PersonIcon className={styles.avatarIcon} />
              </div>
              <div className={styles.heroUserInfo}>
                <h2>{user?.fullName || user?.login || "—"}</h2>
                <p>@{user?.login || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Əsas məzmun ── */}
        <div className={styles.body}>

          {/* Sol panel */}
          <aside className={styles.sidebar}>
            <div className={styles.infoBox}>
              <span className={styles.sidebarLabel}>Rol</span>
              <span
                className={styles.permBadge}
                style={{ color: roleMeta.color, background: roleMeta.bg }}
              >
                {roleMeta.label}
              </span>

              <div className={styles.divider} />

              <span className={styles.sidebarLabel}>İstifadəçi adı</span>
              <span className={styles.sidebarVal}>@{user?.login || "—"}</span>

              {user?.fullName && (
                <>
                  <div className={styles.divider} />
                  <span className={styles.sidebarLabel}>Ad Soyad</span>
                  <span className={styles.sidebarVal}>{user.fullName}</span>
                </>
              )}
            </div>

            {user?.uploadPermission && user.uploadPermission !== "none" && (
              <button className={styles.uploadBtn} onClick={() => navigate("/library/submit")}>
                <UploadFileIcon fontSize="small" /> PDF Yüklə
              </button>
            )}

            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogoutIcon fontSize="small" /> Çıxış
            </button>
          </aside>

          {/* Sağ əsas sahə */}
          <div className={styles.mainArea}>

            {/* Tablar */}
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${tab === "info" ? styles.tabActive : ""}`} onClick={() => setTab("info")}>
                <PersonIcon fontSize="small" /> Məlumatlarım
              </button>
              <button className={`${styles.tab} ${tab === "pdfs" ? styles.tabActive : ""}`} onClick={() => setTab("pdfs")}>
                <PictureAsPdfIcon fontSize="small" /> PDF-lərim
              </button>
              <button className={`${styles.tab} ${tab === "rentals" ? styles.tabActive : ""}`} onClick={() => setTab("rentals")}>
                <BookmarkIcon fontSize="small" /> Kirayələrim
              </button>
              <button className={`${styles.tab} ${tab === "reads" ? styles.tabActive : ""}`} onClick={() => setTab("reads")}>
                <VisibilityIcon fontSize="small" /> Oxuduqlarım
              </button>
              <button className={`${styles.tab} ${tab === "downloads" ? styles.tabActive : ""}`} onClick={() => setTab("downloads")}>
                <DownloadIcon fontSize="small" /> Yükləmələrim
              </button>
            </div>

            {/* TAB: Məlumatlarım */}
            {tab === "info" && (
              <div className={styles.tabContent}>

                {/* İstifadəçi adı dəyiş */}
                <div className={styles.infoCard}>
                  <div className={styles.infoCardHead}>
                    <div className={styles.infoCardTitle}>
                      <EditIcon fontSize="small" />
                      <span>İstifadəçi adını dəyiş</span>
                    </div>
                    <button
                      className={styles.toggleBtn}
                      onClick={() => { setShowLoginForm(v => !v); setLoginMsg({ text: "", ok: false }); }}
                    >
                      {showLoginForm ? "Bağla" : "Dəyiş"}
                    </button>
                  </div>
                  <p className={styles.currentVal}>Cari: <strong>@{user?.login}</strong></p>

                  {showLoginForm && (
                    <form className={styles.form} onSubmit={handleLoginChange}>
                      <input
                        type="text"
                        placeholder="Yeni istifadəçi adı"
                        value={loginForm.login}
                        onChange={(e) => setLoginForm({ login: e.target.value })}
                        required
                        minLength={3}
                      />
                      {loginMsg.text && (
                        <p className={`${styles.msg} ${loginMsg.ok ? styles.msgOk : styles.msgErr}`}>
                          {loginMsg.text}
                        </p>
                      )}
                      <div className={styles.formActions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => setShowLoginForm(false)}>Ləğv et</button>
                        <button type="submit" className={styles.saveBtn}>Yadda saxla</button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Şifrə dəyiş */}
                <div className={styles.infoCard}>
                  <div className={styles.infoCardHead}>
                    <div className={styles.infoCardTitle}>
                      <LockOutlinedIcon fontSize="small" />
                      <span>Şifrəni dəyiş</span>
                    </div>
                    <button
                      className={styles.toggleBtn}
                      onClick={() => { setShowPassForm(v => !v); setPassMsg({ text: "", ok: false }); }}
                    >
                      {showPassForm ? "Bağla" : "Dəyiş"}
                    </button>
                  </div>

                  {showPassForm && (
                    <form className={styles.form} onSubmit={handlePassChange}>
                      <input type="password" placeholder="Köhnə şifrə" value={passForm.oldPassword}
                        onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })} required />
                      <input type="password" placeholder="Yeni şifrə" value={passForm.newPassword}
                        onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} required />
                      <input type="password" placeholder="Yeni şifrəni təsdiqlə" value={passForm.confirmPassword}
                        onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} required />
                      {passMsg.text && (
                        <p className={`${styles.msg} ${passMsg.ok ? styles.msgOk : styles.msgErr}`}>
                          {passMsg.text}
                        </p>
                      )}
                      <div className={styles.formActions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => setShowPassForm(false)}>Ləğv et</button>
                        <button type="submit" className={styles.saveBtn}>Yadda saxla</button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Müəssisə üzvlüyü */}
                <div className={styles.infoCard}>
                  <div className={styles.infoCardHead}>
                    <div className={styles.infoCardTitle}>
                      <BusinessIcon fontSize="small" />
                      <span>Müəssisə üzvlüyü</span>
                    </div>
                  </div>

                  {user?.institutionId ? (
                    <p className={styles.currentVal}>
                      Üzv olduğunuz müəssisə: <strong>{user.institutionName || `#${user.institutionId}`}</strong>
                    </p>
                  ) : (
                    <>
                      <p className={styles.currentVal} style={{ color: "#999" }}>
                        Hər hansı bir müəssisəyə üzv deyilsiniz.
                      </p>
                      {institutions.length > 0 && (
                        <form className={styles.form} onSubmit={handleInstRequest}>
                          <select
                            value={instRequestId}
                            onChange={(e) => { setInstRequestId(e.target.value); setInstMsg({ text: "", ok: false }); }}
                          >
                            <option value="">— Müəssisə seçin —</option>
                            {institutions.map((inst) => (
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
                              <button type="submit" className={styles.saveBtn} disabled={instLoading || !instRequestId}>
                                {instLoading ? "Göndərilir..." : "Sorğu göndər"}
                              </button>
                            </div>
                          )}
                        </form>
                      )}
                    </>
                  )}
                </div>

              </div>
            )}

            {/* TAB: PDF-lərim */}
            {tab === "pdfs" && (
              <div className={styles.tabContent}>
                {myPdfs === null ? (
                  <div className={styles.loader}><CircularProgress /></div>
                ) : myPdfs.length === 0 ? (
                  <div className={styles.empty}>
                    <PictureAsPdfIcon style={{ fontSize: 48, color: "#ccc" }} />
                    <p>Hələ PDF yükləməmisiniz</p>
                    {user?.uploadPermission && user.uploadPermission !== "none" && (
                      <button className={styles.saveBtn} onClick={() => navigate("/library/submit")}>
                        PDF Yüklə
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={styles.pdfList}>
                    {myPdfs.map((pdf) => {
                      const st = STATUS_META[pdf.status] || STATUS_META.pending;
                      return (
                        <div key={pdf.id} className={styles.pdfRow}
                          onClick={() => navigate(`/library/${pdf.id}`)}>
                          <div className={styles.pdfThumb}>
                            {pdf.cover_image_path || pdf.image_path ? (
                              <img src={formatServerFilePath(pdf.cover_image_path || pdf.image_path)}
                                alt={pdf.title} onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <PictureAsPdfIcon style={{ color: "#032062", fontSize: 28 }} />
                            )}
                          </div>
                          <div className={styles.pdfInfo}>
                            <span className={styles.pdfTitle}>{pdf.title}</span>
                            <span className={styles.pdfMeta}>
                              {pdf.category?.name && <span>{pdf.category.name}</span>}
                              <span>{pdf.created_at?.split("T")[0]}</span>
                            </span>
                          </div>
                          <span className={styles.statusBadge}
                            style={{ color: st.color, background: st.bg }}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Kirayələrim */}
            {tab === "rentals" && (
              <div className={styles.tabContent}>
                {myRentals === null ? (
                  <div className={styles.loader}><CircularProgress /></div>
                ) : myRentals.length === 0 ? (
                  <div className={styles.empty}>
                    <BookmarkIcon style={{ fontSize: 48, color: "#ccc" }} />
                    <p>Hələ kitab kirayələməmisiniz</p>
                  </div>
                ) : (
                  <div className={styles.pdfList}>
                    {myRentals.map((r) => {
                      const statusMap = {
                        pending:  { label: "Gözləyir",      color: "#92400e", bg: "#fef3c7" },
                        approved: { label: "Təsdiqlənib",   color: "#166534", bg: "#dcfce7" },
                        rejected: { label: "Rədd edilib",   color: "#dc2626", bg: "#fee2e2" },
                        returned: { label: "Qaytarılıb",    color: "#64748b", bg: "#f1f5f9" },
                      };
                      const st = statusMap[r.status] || statusMap.pending;
                      const endDate = r.end_date ? new Date(r.end_date) : null;
                      const daysLeft = endDate ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                      const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;
                      const isOverdue = daysLeft !== null && daysLeft < 0;
                      return (
                        <div key={r.id} className={styles.rentalRow} onClick={() => navigate(`/library/${r.pdf_id}`)}>
                          <div className={styles.pdfInfo}>
                            <span className={styles.pdfTitle}>{r.pdf_title}</span>
                            <span className={styles.pdfMeta}>
                              <span>{r.institution_name}</span>
                              <span>{r.duration_days} gün</span>
                              {r.end_date && r.status === "approved" && (
                                <span className={isOverdue ? styles.overdue : isUrgent ? styles.urgent : ""}>
                                  {isOverdue ? "⚠️ Gecikmiş!" : `📅 Qaytarma: ${r.end_date.split("T")[0]} (${daysLeft} gün qalıb)`}
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

            {/* TAB: Oxuduqlarım */}
            {tab === "reads" && (
              <div className={styles.tabContent}>
                {myReads === null ? (
                  <div className={styles.loader}><CircularProgress /></div>
                ) : myReads.length === 0 ? (
                  <div className={styles.empty}>
                    <VisibilityIcon style={{ fontSize: 48, color: "#ccc" }} />
                    <p>Hələ heç bir PDF oxumamısınız</p>
                  </div>
                ) : (
                  <div className={styles.pdfList}>
                    {myReads.map((pdf) => (
                      <div key={pdf.id} className={styles.pdfRow} onClick={() => navigate(`/library/${pdf.id}`)}>
                        <div className={styles.pdfThumb}>
                          {pdf.image_path ? (
                            <img src={pdf.image_path} alt={pdf.title} onError={(e) => { e.target.style.display = "none"; }} />
                          ) : (
                            <PictureAsPdfIcon style={{ color: "#032062", fontSize: 28 }} />
                          )}
                        </div>
                        <div className={styles.pdfInfo}>
                          <span className={styles.pdfTitle}>{pdf.title}</span>
                          <span className={styles.pdfMeta}>
                            {pdf.category_name && <span>{pdf.category_name}</span>}
                            <span>{pdf.created_at?.split("T")[0]}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Yükləmələrim */}
            {tab === "downloads" && (
              <div className={styles.tabContent}>
                {myDownloads === null ? (
                  <div className={styles.loader}><CircularProgress /></div>
                ) : myDownloads.length === 0 ? (
                  <div className={styles.empty}>
                    <DownloadIcon style={{ fontSize: 48, color: "#ccc" }} />
                    <p>Hələ heç bir PDF yükləməmisiniz</p>
                  </div>
                ) : (
                  <div className={styles.pdfList}>
                    {myDownloads.map((pdf) => (
                      <div key={pdf.id} className={styles.pdfRow} onClick={() => navigate(`/library/${pdf.id}`)}>
                        <div className={styles.pdfThumb}>
                          {pdf.image_path ? (
                            <img src={pdf.image_path} alt={pdf.title} onError={(e) => { e.target.style.display = "none"; }} />
                          ) : (
                            <PictureAsPdfIcon style={{ color: "#032062", fontSize: 28 }} />
                          )}
                        </div>
                        <div className={styles.pdfInfo}>
                          <span className={styles.pdfTitle}>{pdf.title}</span>
                          <span className={styles.pdfMeta}>
                            {pdf.category_name && <span>{pdf.category_name}</span>}
                            <span>{pdf.created_at?.split("T")[0]}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ProfilPage;
