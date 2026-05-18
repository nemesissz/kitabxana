import { useEffect, useState } from "react";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import styles from "./index.module.scss";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import BusinessIcon from "@mui/icons-material/Business";
import CircularProgress from "@mui/material/CircularProgress";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)} san. əvvəl`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq. əvvəl`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
  return `${Math.floor(diff / 86400)} gün əvvəl`;
}

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Elanlar | MMU Kitabxana";
    const token = localStorage.getItem("token");
    axios.get(Base_Url_Server + "announcements", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => setAnnouncements(res.data.data.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Elanlar</h1>

        {loading ? (
          <div className={styles.center}><CircularProgress /></div>
        ) : announcements.length === 0 ? (
          <div className={styles.center}>Aktiv elan yoxdur</div>
        ) : (
          <div className={styles.list}>
            {announcements.map(ann => (
              <div key={ann.id} className={`${styles.card} ${ann.priority === "urgent" ? styles.urgent : ""}`}>
                <div className={styles.cardTop}>
                  <div className={styles.badges}>
                    {ann.priority === "urgent"
                      ? <><WarningAmberIcon className={styles.iconUrgent} /><span className={`${styles.badge} ${styles.badgeUrgent}`}>Təcili</span></>
                      : <><NotificationsActiveIcon className={styles.iconNormal} /><span className={`${styles.badge} ${styles.badgeNormal}`}>Elan</span></>}

                    {/* Sender badge */}
                    {ann.institution_id
                      ? <span className={styles.senderBadge}>
                          <BusinessIcon style={{ fontSize: 13, marginRight: 3 }} />
                          {ann.institution_name || "Müəssisə"}
                        </span>
                      : <span className={styles.senderBadgeGlobal}>MMU Kitabxanası</span>}
                  </div>
                  <span className={styles.time}>{timeAgo(ann.created_at)}</span>
                </div>

                <h3 className={styles.title}>{ann.title}</h3>

                {ann.image && (
                  <img src={ann.image} alt={ann.title} className={styles.image} />
                )}

                <p className={styles.desc}>{ann.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnnouncementsPage;
