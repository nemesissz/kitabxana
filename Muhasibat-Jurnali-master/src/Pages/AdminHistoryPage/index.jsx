import { useContext, useEffect, useState, useCallback } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import LoginIcon from "@mui/icons-material/Login";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const EVENT_META = {
  user_registered: { label: "Yeni qeydiyyat",      Icon: PersonAddAlt1Icon,        cls: "tagGreen" },
  user_deleted:    { label: "İstifadəçi silindi",   Icon: PersonRemoveIcon,          cls: "tagRed"   },
  user_login:      { label: "İstifadəçi girişi",    Icon: LoginIcon,                 cls: "tagBlue"  },
  admin_login:     { label: "Admin girişi",          Icon: AdminPanelSettingsIcon,    cls: "tagBlue"  },
  pdf_uploaded:    { label: "PDF yükləndi",          Icon: UploadFileIcon,            cls: "tagBlue"  },
  pdf_approved:    { label: "PDF qəbul edildi",      Icon: CheckCircleOutlineIcon,    cls: "tagGreen" },
  pdf_rejected:    { label: "PDF rədd edildi",       Icon: CancelOutlinedIcon,        cls: "tagRed"   },
  pdf_deleted:     { label: "PDF silindi",           Icon: CancelOutlinedIcon,        cls: "tagRed"   },
};

const TABS = [
  { key: "all",   label: "Hamısı" },
  { key: "users", label: "İstifadəçilər" },
  { key: "pdfs",  label: "PDFlər" },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)} san. əvvəl`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq. əvvəl`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
  return `${Math.floor(diff / 86400)} gün əvvəl`;
}

function AdminHistoryPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");

  const adminRole = store.admin.data?.role ?? 0;
  const adminInstitutionId = store.admin.data?.institutionId ?? null;
  const adminIsMain = institutions.find(i => i.id === adminInstitutionId)?.is_main;
  const isGlobalScope = institutions.length > 0
    ? (adminRole >= 4 || (adminInstitutionId && adminIsMain))
    : adminRole >= 4;

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { navigate("/admin/login"); return; }
    axios.get(`${Base_Url_Server}users/${adminID}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then(r => store.admin.setData(r.data.data.user))
      .catch(() => navigate("/admin/login"));
  }, []);

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    axios.get(`${Base_Url_Server}institutions`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then(r => setInstitutions(r.data.data.institutions || [])).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async (p = 1, eventType = tab) => {
    setLoading(true);
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      const params = new URLSearchParams({ page: p, limit: 30 });
      if (eventType !== "all") params.append("eventType", eventType);
      if (isGlobalScope && selectedInstitution) params.append("institutionId", selectedInstitution);
      const res = await axios.get(`${Base_Url_Server}activity-logs?${params}`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setLogs(res.data.data.logs || []);
      setPagination(res.data.data.pagination || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedInstitution, isGlobalScope]);

  useEffect(() => { fetchLogs(page, tab); }, [page, tab, selectedInstitution]);

  const handleTab = (key) => {
    setTab(key);
    setPage(1);
  };

  const handleInstitutionChange = (e) => {
    setSelectedInstitution(e.target.value);
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Tarixçə</h2>
        {pagination && (
          <span className={styles.total}>Cəmi {pagination.total} hadisə</span>
        )}
      </div>

      {isGlobalScope && institutions.length > 0 && (
        <div className={styles.filterBar}>
          <label className={styles.filterLabel}>Müəssisə:</label>
          <select
            className={styles.filterSelect}
            value={selectedInstitution}
            onChange={handleInstitutionChange}
          >
            <option value="">Hamısı</option>
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => handleTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.timeline}>
        {loading ? (
          <div className={styles.center}><CircularProgress /></div>
        ) : logs.length === 0 ? (
          <div className={styles.center}>Heç bir hadisə tapılmadı</div>
        ) : logs.map(log => {
          const meta = EVENT_META[log.event_type] || { label: log.event_type, Icon: UploadFileIcon, cls: "tagBlue" };
          const { Icon } = meta;
          return (
            <div key={log.id} className={styles.entry}>
              <div className={`${styles.iconWrap} ${styles[meta.cls]}`}>
                <Icon fontSize="small" />
              </div>
              <div className={styles.body}>
                <div className={styles.entryTop}>
                  <span className={`${styles.tag} ${styles[meta.cls]}`}>{meta.label}</span>
                  <span className={styles.time} title={new Date(log.created_at).toLocaleString("az-AZ")}>
                    {timeAgo(log.created_at)}
                  </span>
                </div>
                <div className={styles.detail}>
                  {log.actor_email && (
                    <span className={styles.actor}>{log.actor_email}</span>
                  )}
                  {log.details?.title && (
                    <span className={styles.targetTitle}>"{log.details.title}"</span>
                  )}
                  {log.details?.email && log.event_type !== "user_registered" && (
                    <span className={styles.targetTitle}>{log.details.email}</span>
                  )}
                  {log.details?.category_name && (
                    <span className={styles.metaChip}>{log.details.category_name}</span>
                  )}
                  {log.details?.language && (
                    <span className={styles.metaChip}>{log.details.language.toUpperCase()}</span>
                  )}
                  {(log.details?.order_number || log.details?.author) && (
                    <span className={styles.metaChip}>
                      {log.details.order_number || log.details.author}
                    </span>
                  )}
                  {log.details?.status === "pending" && (
                    <span className={styles.pendingBadge}>Gözləmədə</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Əvvəlki</button>
          <span>{page} / {pagination.total_pages}</span>
          <button disabled={page === pagination.total_pages} onClick={() => setPage(p => p + 1)}>Növbəti →</button>
        </div>
      )}
    </div>
  );
}

export default AdminHistoryPage;
