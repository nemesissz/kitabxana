import { useContext, useEffect, useState, useCallback } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import TuneIcon from "@mui/icons-material/Tune";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

function AdminServicesPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ default_limit_mb: 20, daily_upload_limit: 0, institutions: [], users: [] });

  const [defaultInput, setDefaultInput] = useState("");
  const [defaultSaving, setDefaultSaving] = useState(false);

  const [dailyInput, setDailyInput] = useState("");
  const [dailySaving, setDailySaving] = useState(false);

  const [instInputs, setInstInputs] = useState({});
  const [instSaving, setInstSaving] = useState({});

  const [userInputs, setUserInputs] = useState({});
  const [userSaving, setUserSaving] = useState({});

  // Permission management state
  const [permInstitutions, setPermInstitutions] = useState([]);
  const [selectedPermInstId, setSelectedPermInstId] = useState("");
  const [permUsers, setPermUsers] = useState([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState({});

  const token = localStorage.getItem("tokenAdmin");

  useEffect(() => {
    const adminID = localStorage.getItem("admin");
    if (!token || !adminID) { navigate("/admin/login"); return; }
    axios.get(`${Base_Url_Server}users/${adminID}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const u = res.data.data.user;
      store.admin.setData(u);
      if ((u.role || 0) < 4) {
        navigate("/admin");
      }
    }).catch(() => navigate("/admin/login"));
  }, []);

  const fetchLimits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${Base_Url_Server}settings/upload-limits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data.data;
      setData(d);
      setDefaultInput(String(d.default_limit_mb));
      setDailyInput(String(d.daily_upload_limit ?? 0));
      const ii = {};
      d.institutions.forEach(inst => { ii[inst.id] = inst.limit_mb !== null ? String(inst.limit_mb) : ""; });
      setInstInputs(ii);
      const ui = {};
      d.users.forEach(u => { ui[u.id] = u.limit_mb !== null ? String(u.limit_mb) : ""; });
      setUserInputs(ui);
    } catch {
      Swal.fire("Xəta", "Məlumatlar yüklənə bilmədi", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchLimits(); }, [fetchLimits]);

  // Fetch non-main institutions for permission management
  useEffect(() => {
    if (!token) return;
    axios.get(`${Base_Url_Server}institutions`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => {
      const all = r.data.data?.institutions || r.data.data || [];
      setPermInstitutions(all.filter((i) => !i.is_main));
    }).catch(() => {});
  }, [token]);

  // Fetch users when institution changes
  useEffect(() => {
    if (!selectedPermInstId) { setPermUsers([]); return; }
    setPermLoading(true);
    axios.get(`${Base_Url_Server}users?institutionId=${selectedPermInstId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => {
      const users = (r.data.data?.users || []).filter((u) => u.role >= 2 && u.role <= 3);
      setPermUsers(users);
    }).catch(() => {
      Swal.fire("Xəta", "İstifadəçilər yüklənə bilmədi", "error");
    }).finally(() => setPermLoading(false));
  }, [selectedPermInstId, token]);

  const permKeyMap = {
    category_permission: "categoryPermission",
    language_permission: "languagePermission",
    pdf_review_permission: "pdfReviewPermission",
    upload_permission: "uploadPermission",
  };

  const updatePerm = async (userId, permKey, value) => {
    setPermSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      await axios.patch(
        `${Base_Url_Server}users/${userId}/permissions`,
        { [permKey]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPermUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, [permKeyMap[permKey]]: value } : u
        )
      );
    } catch {
      Swal.fire("Xəta", "İcazə yenilənə bilmədi", "error");
    } finally {
      setPermSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const roleLabel = (role) =>
    role === 3 ? "Kitabxana Müdiri" : "Kitabxana İşçisi";

  const saveDaily = async () => {
    const val = parseInt(dailyInput);
    if (isNaN(val) || val < 0) return Swal.fire("Xəta", "0 və ya müsbət ədəd daxil edin", "error");
    setDailySaving(true);
    try {
      await axios.put(`${Base_Url_Server}settings/daily-upload-limit`,
        { daily_upload_limit: val }, { headers: { Authorization: `Bearer ${token}` } });
      setData(prev => ({ ...prev, daily_upload_limit: val }));
      Swal.fire({ icon: "success", title: "Saxlanıldı!", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Xəta", "Saxlanıla bilmədi", "error"); }
    finally { setDailySaving(false); }
  };

  const saveDefault = async () => {
    const val = parseFloat(defaultInput);
    if (!val || val <= 0) return Swal.fire("Xəta", "Düzgün limit daxil edin", "error");
    setDefaultSaving(true);
    try {
      await axios.put(`${Base_Url_Server}settings/upload-limits/default`,
        { limit_mb: val }, { headers: { Authorization: `Bearer ${token}` } });
      setData(prev => ({ ...prev, default_limit_mb: val }));
      Swal.fire({ icon: "success", title: "Saxlanıldı!", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Xəta", "Saxlanıla bilmədi", "error"); }
    finally { setDefaultSaving(false); }
  };

  const saveInstLimit = async (instId) => {
    const val = parseFloat(instInputs[instId]);
    if (!val || val <= 0) return Swal.fire("Xəta", "Düzgün limit daxil edin", "error");
    setInstSaving(prev => ({ ...prev, [instId]: true }));
    try {
      await axios.put(`${Base_Url_Server}settings/upload-limits/institution/${instId}`,
        { limit_mb: val }, { headers: { Authorization: `Bearer ${token}` } });
      setData(prev => ({
        ...prev,
        institutions: prev.institutions.map(i => i.id === instId ? { ...i, limit_mb: val } : i)
      }));
      Swal.fire({ icon: "success", title: "Saxlanıldı!", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Xəta", "Saxlanıla bilmədi", "error"); }
    finally { setInstSaving(prev => ({ ...prev, [instId]: false })); }
  };

  const resetInstLimit = async (instId) => {
    const result = await Swal.fire({
      icon: "question", title: "Limiti sıfırla?",
      text: "Müəssisə üçün xüsusi limit silinəcək, standart limit tətbiq olunacaq.",
      showCancelButton: true, confirmButtonText: "Sıfırla",
      cancelButtonText: "Ləğv et", confirmButtonColor: "#e74c3c",
    });
    if (!result.isConfirmed) return;
    setInstSaving(prev => ({ ...prev, [instId]: true }));
    try {
      await axios.delete(`${Base_Url_Server}settings/upload-limits/institution/${instId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(prev => ({
        ...prev,
        institutions: prev.institutions.map(i => i.id === instId ? { ...i, limit_mb: null } : i)
      }));
      setInstInputs(prev => ({ ...prev, [instId]: "" }));
      Swal.fire({ icon: "success", title: "Sıfırlandı!", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Xəta", "Sıfırlana bilmədi", "error"); }
    finally { setInstSaving(prev => ({ ...prev, [instId]: false })); }
  };

  const saveUserLimit = async (userId) => {
    const val = parseFloat(userInputs[userId]);
    if (!val || val <= 0) return Swal.fire("Xəta", "Düzgün limit daxil edin", "error");
    setUserSaving(prev => ({ ...prev, [userId]: true }));
    try {
      await axios.put(`${Base_Url_Server}settings/upload-limits/user/${userId}`,
        { limit_mb: val }, { headers: { Authorization: `Bearer ${token}` } });
      setData(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === userId ? { ...u, limit_mb: val } : u)
      }));
      Swal.fire({ icon: "success", title: "Saxlanıldı!", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Xəta", "Saxlanıla bilmədi", "error"); }
    finally { setUserSaving(prev => ({ ...prev, [userId]: false })); }
  };

  const resetUserLimit = async (userId) => {
    const result = await Swal.fire({
      icon: "question", title: "Limiti sıfırla?",
      text: "İstifadəçinin xüsusi limiti silinəcək.",
      showCancelButton: true, confirmButtonText: "Sıfırla",
      cancelButtonText: "Ləğv et", confirmButtonColor: "#e74c3c",
    });
    if (!result.isConfirmed) return;
    setUserSaving(prev => ({ ...prev, [userId]: true }));
    try {
      await axios.delete(`${Base_Url_Server}settings/upload-limits/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === userId ? { ...u, limit_mb: null } : u)
      }));
      setUserInputs(prev => ({ ...prev, [userId]: "" }));
      Swal.fire({ icon: "success", title: "Sıfırlandı!", timer: 1200, showConfirmButton: false });
    } catch { Swal.fire("Xəta", "Sıfırlana bilmədi", "error"); }
    finally { setUserSaving(prev => ({ ...prev, [userId]: false })); }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <TuneIcon />
        <h2>Sayt Parametrləri</h2>
      </div>

      {/* ── Standart limit ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⚙️</span>
          Standart PDF Yükləmə Limiti
        </div>
        <p className={styles.sectionDesc}>
          Xüsusi limiti olmayan bütün istifadəçilərə bu limit tətbiq olunur.
        </p>
        <div className={styles.defaultRow}>
          <div className={styles.inputWrap}>
            <input
              type="number" min={1} step={1}
              value={defaultInput}
              onChange={e => setDefaultInput(e.target.value)}
              className={styles.limitInput}
            />
            <span className={styles.mbLabel}>MB</span>
          </div>
          <button className={styles.saveBtn} onClick={saveDefault} disabled={defaultSaving}>
            {defaultSaving ? <CircularProgress size={16} style={{ color: "#fff" }} /> : <SaveIcon fontSize="small" />}
            Saxla
          </button>
        </div>
      </div>

      {/* ── Günlük say limiti ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📅</span>
          Töhfəçilər üçün Günlük Yükləmə Limiti (Say)
        </div>
        <p className={styles.sectionDesc}>
          Heç bir müəssisəyə üzv olmayan töhfəçilərin (rol = 1) bir gündə yükləyə biləcəyi PDF sayı.
          Müəssisə üzvlərinə bu limit tətbiq edilmir.{" "}
          <strong>0 = limitsiz.</strong>
        </p>
        <div className={styles.defaultRow}>
          <div className={styles.inputWrap}>
            <input
              type="number" min={0} step={1}
              value={dailyInput}
              onChange={e => setDailyInput(e.target.value)}
              className={styles.limitInput}
              placeholder="0 = limitsiz"
            />
            <span className={styles.mbLabel}>PDF/gün</span>
          </div>
          {data.daily_upload_limit > 0
            ? <span className={styles.limitBadge}>Hal-hazırda: {data.daily_upload_limit} PDF/gün</span>
            : <span className={styles.defaultBadge}>Hal-hazırda: limitsiz</span>
          }
          <button className={styles.saveBtn} onClick={saveDaily} disabled={dailySaving}>
            {dailySaving ? <CircularProgress size={16} style={{ color: "#fff" }} /> : <SaveIcon fontSize="small" />}
            Saxla
          </button>
        </div>
      </div>

      {/* ── Müəssisə limitləri ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <BusinessIcon fontSize="small" />
          Müəssisə Limitləri
        </div>
        <p className={styles.sectionDesc}>
          Müəssisəyə xüsusi limit təyin edilmədikdə standart limit tətbiq olunur.
        </p>

        {data.institutions.length === 0 ? (
          <div className={styles.empty}>Heç bir müəssisə tapılmadı.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Müəssisə</th>
                <th>Cari limit</th>
                <th>Yeni limit (MB)</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {data.institutions.map(inst => (
                <tr key={inst.id}>
                  <td className={styles.nameCell}>{inst.name}</td>
                  <td>
                    {inst.limit_mb !== null
                      ? <span className={styles.limitBadge}>{inst.limit_mb} MB</span>
                      : <span className={styles.defaultBadge}>Standart ({data.default_limit_mb} MB)</span>
                    }
                  </td>
                  <td>
                    <div className={styles.inputWrap}>
                      <input
                        type="number" min={1} step={1}
                        placeholder={String(inst.limit_mb ?? data.default_limit_mb)}
                        value={instInputs[inst.id] ?? ""}
                        onChange={e => setInstInputs(prev => ({ ...prev, [inst.id]: e.target.value }))}
                        className={styles.limitInput}
                      />
                      <span className={styles.mbLabel}>MB</span>
                    </div>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      className={styles.saveBtn}
                      onClick={() => saveInstLimit(inst.id)}
                      disabled={instSaving[inst.id]}
                    >
                      {instSaving[inst.id] ? <CircularProgress size={14} style={{ color: "#fff" }} /> : <SaveIcon fontSize="small" />}
                      Saxla
                    </button>
                    {inst.limit_mb !== null && (
                      <button
                        className={styles.resetBtn}
                        onClick={() => resetInstLimit(inst.id)}
                        disabled={instSaving[inst.id]}
                        title="Standarta qayıt"
                      >
                        <RestartAltIcon fontSize="small" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── İcazə İdarəetmə ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <AdminPanelSettingsIcon fontSize="small" />
          İstifadəçi İcazələri
        </div>
        <p className={styles.sectionDesc}>
          Müəssisə işçilərinin kateqoriya, dil, PDF sorğusu və yükləmə icazələrini idarə edin.
        </p>

        <div className={styles.permInstRow}>
          <label className={styles.permInstLabel}>Müəssisə:</label>
          <select
            className={styles.permInstSelect}
            value={selectedPermInstId}
            onChange={(e) => setSelectedPermInstId(Number(e.target.value) || "")}
          >
            <option value="">Seçin...</option>
            {permInstitutions.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>

        {permLoading && (
          <div className={styles.permLoading}><CircularProgress size={24} /></div>
        )}

        {!permLoading && selectedPermInstId && permUsers.length === 0 && (
          <div className={styles.empty}>Bu müəssisədə işçi tapılmadı.</div>
        )}

        {!permLoading && permUsers.map((u) => (
          <div key={u.id} className={styles.permUserCard}>
            <div className={styles.permUserHeader}>
              <PersonIcon fontSize="small" />
              <span className={styles.permUserName}>{u.profile?.fullName || u.login}</span>
              <span className={styles.permUserRole}>{roleLabel(u.role)}</span>
              {permSaving[u.id] && <CircularProgress size={14} style={{ marginLeft: 8, color: "#5a7a9a" }} />}
            </div>

            <div className={styles.permRow}>
              <span className={styles.permLabel}>Kateqoriya yaratma:</span>
              <div className={styles.permBtnGroup}>
                {[
                  { val: "direct", label: "İcazəli" },
                  { val: "request", label: "Sorğu əsasında" },
                  { val: "none", label: "İcazəsiz" },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    className={`${styles.permBtn} ${u.categoryPermission === val ? styles[`permBtnActive_${val}`] : ""}`}
                    onClick={() => updatePerm(u.id, "category_permission", val)}
                    disabled={permSaving[u.id]}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div className={styles.permRow}>
              <span className={styles.permLabel}>Dil yaratma:</span>
              <div className={styles.permBtnGroup}>
                {[
                  { val: "direct", label: "İcazəli" },
                  { val: "request", label: "Sorğu əsasında" },
                  { val: "none", label: "İcazəsiz" },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    className={`${styles.permBtn} ${u.languagePermission === val ? styles[`permBtnActive_${val}`] : ""}`}
                    onClick={() => updatePerm(u.id, "language_permission", val)}
                    disabled={permSaving[u.id]}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div className={styles.permRow}>
              <span className={styles.permLabel}>PDF sorğusu qəbul:</span>
              <div className={styles.permBtnGroup}>
                {[
                  { val: "allowed", label: "İcazəli" },
                  { val: "none", label: "İcazəsiz" },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    className={`${styles.permBtn} ${u.pdfReviewPermission === val ? styles[val === "allowed" ? "permBtnActive_direct" : "permBtnActive_none"] : ""}`}
                    onClick={() => updatePerm(u.id, "pdf_review_permission", val)}
                    disabled={permSaving[u.id]}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div className={styles.permRow}>
              <span className={styles.permLabel}>PDF yükləmə:</span>
              <div className={styles.permBtnGroup}>
                {[
                  { val: "free", label: "İcazəli" },
                  { val: "pending", label: "Sorğu əsasında" },
                  { val: "none", label: "İcazəsiz" },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    className={`${styles.permBtn} ${u.uploadPermission === val ? styles[val === "free" ? "permBtnActive_direct" : val === "pending" ? "permBtnActive_request" : "permBtnActive_none"] : ""}`}
                    onClick={() => updatePerm(u.id, "upload_permission", val)}
                    disabled={permSaving[u.id]}
                  >{label}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Müəssisəsiz töhfəçilər ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <PersonIcon fontSize="small" />
          Müəssisəsiz Töhfəçilər
        </div>
        <p className={styles.sectionDesc}>
          Heç bir müəssisəyə üzv olmayan, PDF yükləmə icazəsi olan istifadəçilər.
        </p>

        {data.users.length === 0 ? (
          <div className={styles.empty}>Müəssisəsiz töhfəçi tapılmadı.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>İstifadəçi</th>
                <th>İcazə növü</th>
                <th>Cari limit</th>
                <th>Yeni limit (MB)</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => (
                <tr key={user.id}>
                  <td className={styles.nameCell}>{user.login}</td>
                  <td>
                    <span className={user.upload_permission === 'free' ? styles.freeBadge : styles.pendingBadge}>
                      {user.upload_permission === 'free' ? 'Birbaşa' : 'Gözləmədə'}
                    </span>
                  </td>
                  <td>
                    {user.limit_mb !== null
                      ? <span className={styles.limitBadge}>{user.limit_mb} MB</span>
                      : <span className={styles.defaultBadge}>Standart ({data.default_limit_mb} MB)</span>
                    }
                  </td>
                  <td>
                    <div className={styles.inputWrap}>
                      <input
                        type="number" min={1} step={1}
                        placeholder={String(user.limit_mb ?? data.default_limit_mb)}
                        value={userInputs[user.id] ?? ""}
                        onChange={e => setUserInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
                        className={styles.limitInput}
                      />
                      <span className={styles.mbLabel}>MB</span>
                    </div>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      className={styles.saveBtn}
                      onClick={() => saveUserLimit(user.id)}
                      disabled={userSaving[user.id]}
                    >
                      {userSaving[user.id] ? <CircularProgress size={14} style={{ color: "#fff" }} /> : <SaveIcon fontSize="small" />}
                      Saxla
                    </button>
                    {user.limit_mb !== null && (
                      <button
                        className={styles.resetBtn}
                        onClick={() => resetUserLimit(user.id)}
                        disabled={userSaving[user.id]}
                        title="Standarta qayıt"
                      >
                        <RestartAltIcon fontSize="small" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminServicesPage;
