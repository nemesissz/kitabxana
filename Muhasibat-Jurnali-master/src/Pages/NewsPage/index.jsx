import { useEffect, useState } from "react";
import styles from "./index.module.scss";
import Footer from "../../Layouts/Footer";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate } from "react-router-dom";

function NewsPage() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState(null);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");

  useEffect(() => {
    document.title = "Elanlar — MMU Kitabxana";
    axios
      .get(Base_Url_Server + "announcements")
      .then((res) => setAnnouncements(res.data.data.announcements || []))
      .catch(() => setAnnouncements([]));
  }, []);

  const filtered = announcements
    ? announcements.filter((a) => {
        const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
        const matchPriority = !priority || a.priority === priority;
        return matchSearch && matchPriority;
      })
    : [];

  const formatDate = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      return `${dt.getDate().toString().padStart(2, "0")}.${(dt.getMonth() + 1).toString().padStart(2, "0")}.${dt.getFullYear()}`;
    } catch { return ""; }
  };

  return (
    <>
      <main>
        {/* ── Hero strip ── */}
        <section className={styles.heroStrip}>
          <div className="mmu-container">
            <span className="mmu-eyebrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 4 }}>
                <path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/>
                <path d="M8 10h8M8 14h5"/>
              </svg>
              Bildirişlər
            </span>
            <h1 className={styles.heroTitle}>Elanlar</h1>
            <p className="mmu-lead">Universitetin ən son elanları və duyuruları.</p>
          </div>
        </section>

        <div className="mmu-container" style={{ paddingBottom: 80 }}>
          {/* ── Filter bar ── */}
          <form className={styles.filterBar} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.searchWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                className={styles.searchField}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Elan axtar…"
              />
              {search && (
                <button type="button" className={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
              )}
            </div>

            <div className={styles.priorityFilter}>
              {[
                { val: "", label: "Hamısı" },
                { val: "normal", label: "Normal" },
                { val: "urgent", label: "Təcili" },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  className={`${styles.priorityBtn} ${priority === p.val ? styles.priorityBtnActive : ""}`}
                  onClick={() => setPriority(p.val)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </form>

          {/* ── Count ── */}
          {announcements !== null && (
            <p className={styles.resultCount}>
              {filtered.length} elan tapıldı
            </p>
          )}

          {/* ── Results ── */}
          {announcements === null ? (
            <div className={styles.loader}><div className={styles.spinner} /></div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", margin: "0 auto 12px", display: "block" }}>
                <path d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/>
                <path d="M8 10h8M8 14h5"/>
              </svg>
              <p>Elan tapılmadı</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((ann) => (
                <article
                  key={ann.id}
                  className={`${styles.card} ${ann.priority === "urgent" ? styles.cardUrgent : ""}`}
                  onClick={() => navigate(`/news/${ann.id}`, { state: { announcement: ann } })}
                >
                  {ann.image && (
                    <div className={styles.cardImg}>
                      <img
                        src={ann.image}
                        alt={ann.title}
                        onError={(e) => { e.target.parentElement.style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <span className={`${styles.priorityChip} ${ann.priority === "urgent" ? styles.chipUrgent : styles.chipNormal}`}>
                        {ann.priority === "urgent" ? "Təcili" : "Normal"}
                      </span>
                      <span className={styles.cardDate}>{formatDate(ann.created_at)}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{ann.title}</h3>
                    {ann.description && (
                      <p className={styles.cardDesc}>
                        {ann.description.length > 110
                          ? ann.description.slice(0, 110) + "…"
                          : ann.description}
                      </p>
                    )}
                    <span className={styles.readMore}>Ətraflı oxu →</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default NewsPage;
