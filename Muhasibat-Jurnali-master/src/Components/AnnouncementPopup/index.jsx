import { useEffect, useState } from "react";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import styles from "./index.module.scss";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

function AnnouncementPopup() {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(Base_Url_Server + "announcements", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        const all = res.data.data.announcements || [];
        const dismissed = JSON.parse(localStorage.getItem("dismissedAnnouncements") || "[]");
        const pending = all.filter(a => !dismissed.includes(a.id));
        if (pending.length > 0) {
          setItems(pending);
          setCurrent(0);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    const ann = items[current];
    const dismissed = JSON.parse(localStorage.getItem("dismissedAnnouncements") || "[]");
    localStorage.setItem("dismissedAnnouncements", JSON.stringify([...dismissed, ann.id]));

    if (current + 1 < items.length) {
      setCurrent(c => c + 1);
    } else {
      setVisible(false);
    }
  };

  if (!visible || items.length === 0) return null;

  const ann = items[current];
  const isUrgent = ann.priority === "urgent";

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${isUrgent ? styles.urgent : ""}`}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            {isUrgent
              ? <WarningAmberIcon className={styles.iconUrgent} />
              : <NotificationsActiveIcon className={styles.iconNormal} />}
            <span className={`${styles.badge} ${isUrgent ? styles.badgeUrgent : styles.badgeNormal}`}>
              {isUrgent ? "Təcili Elan" : "Elan"}
            </span>
            {items.length > 1 && (
              <span className={styles.counter}>{current + 1} / {items.length}</span>
            )}
          </div>
        </div>

        <h3 className={styles.title}>{ann.title}</h3>

        {ann.image && (
          <img src={ann.image} alt={ann.title} className={styles.image} />
        )}

        <p className={styles.desc}>{ann.description}</p>

        <button className={`${styles.closeBtn} ${isUrgent ? styles.closeBtnUrgent : ""}`} onClick={dismiss}>
          <CloseIcon fontSize="small" />
          Oxudum, bağla
          {items.length > 1 && current + 1 < items.length && ` (${items.length - current - 1} elan qalır)`}
        </button>
      </div>
    </div>
  );
}

export default AnnouncementPopup;
