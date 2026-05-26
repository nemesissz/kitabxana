import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import styles from "./index.module.scss";
import Footer from "../../Layouts/Footer";

/* ── Icons ── */
const MegaphoneIcon = ({ w = 20, h = 20 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
  </svg>
);
const PinIcon = ({ w = 16, h = 16 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1v3.76z"/>
  </svg>
);
const BellIcon = ({ w = 24, h = 24 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-6-6 6 6-6 6"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

/* ── Helpers ── */
function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch { return ""; }
}

function getThisWeekCount(list) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return list.filter(a => now - new Date(a.created_at) < weekMs).length;
}

function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
}

/* ── Badge component ── */
function CatBadge({ label, urgent }) {
  if (urgent) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center",
        padding: "4px 10px", borderRadius: "999px",
        fontSize: 12, fontWeight: 600,
        background: "var(--bad)", color: "#fff", border: 0,
      }}>{label}</span>
    );
  }
  return (
    <span className="badge">{label}</span>
  );
}

/* ── Main Component ── */
function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(null);

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

  /* Derive category from announcement fields */
  const getCategory = (ann) =>
    ann.category_name || ann.category || ann.tag || ann.type || "Elan";

  const isPinned = (ann) => ann.is_pinned || ann.pinned || false;
  const isUrgent = (ann) => ann.priority === "urgent" || ann.is_urgent || ann.urgent || false;
  const getAuthor = (ann) =>
    ann.author_name || ann.author || ann.institution_name || "MMU Kitabxanası";

  /* Unique category list */
  const cats = useMemo(() => {
    const seen = new Set();
    const list = ["all"];
    announcements.forEach(a => {
      const c = getCategory(a);
      if (!seen.has(c)) { seen.add(c); list.push(c); }
    });
    return list;
  }, [announcements]);

  const pinned = useMemo(() => announcements.filter(isPinned), [announcements]);

  const filtered = useMemo(() => {
    let r = [...announcements];
    if (cat !== "all") r = r.filter(a => getCategory(a) === cat);
    if (q.trim()) {
      const lq = q.toLowerCase();
      r = r.filter(a =>
        a.title?.toLowerCase().includes(lq) ||
        (a.description || a.summary || "").toLowerCase().includes(lq)
      );
    }
    return r.sort((a, b) =>
      (Number(isPinned(b)) - Number(isPinned(a))) ||
      (new Date(b.created_at) - new Date(a.created_at))
    );
  }, [q, cat, announcements]);

  /* Upcoming event — find nearest future event-type announcement */
  const upcomingEvent = useMemo(() => {
    const now = Date.now();
    return announcements
      .filter(a => {
        const c = getCategory(a).toLowerCase();
        return c.includes("tədbir") || c.includes("event");
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
  }, [announcements]);

  /* Popular tags — top categories */
  const popularTags = useMemo(() => {
    const freq = {};
    announcements.forEach(a => {
      const c = getCategory(a);
      freq[c] = (freq[c] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t);
  }, [announcements]);

  const thisWeek = getThisWeekCount(announcements);

  return (
    <>
      <div className="page-enter">

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className="mmu-container">
            <span className="mmu-eyebrow">
              <MegaphoneIcon w={16} h={16} />
              Elanlar
            </span>

            <div className={styles.heroGrid}>
              {/* Left */}
              <div>
                <h1 className={styles.heroTitle}>
                  Universitetin{" "}
                  <span style={{ position: "relative", display: "inline-block" }}>
                    <span style={{ position: "relative", zIndex: 2 }}>son elanları</span>
                    <span style={{ position: "absolute", left: -4, right: -4, bottom: 4, height: "32%", background: "var(--accent)", borderRadius: 4, zIndex: 1 }} />
                  </span>{" "}
                  və duyuruları.
                </h1>
                <p className={styles.heroLead}>
                  Kitabxana, akademik tədbirlər, qaydalar və yenilikləri burada izləyin.
                </p>
              </div>

              {/* Stats card */}
              <div className={styles.statsCard}>
                <div className={styles.statsTop}>
                  <div>
                    <div className={styles.statsLabel}>Aktiv elan</div>
                    <div className={styles.statsNum}>{announcements.length}</div>
                  </div>
                  <div className={styles.statsIcon}>
                    <MegaphoneIcon w={28} h={28} />
                  </div>
                </div>
                <div className={styles.statsRow}>
                  <div>
                    <div className={styles.statsSubLabel}>Sancılmış</div>
                    <div className={styles.statsSubNum}>{pinned.length}</div>
                  </div>
                  <div className={styles.statsDivider} />
                  <div>
                    <div className={styles.statsSubLabel}>Vacib</div>
                    <div className={styles.statsSubNum}>{announcements.filter(isUrgent).length}</div>
                  </div>
                  <div className={styles.statsDivider} />
                  <div>
                    <div className={styles.statsSubLabel}>Bu həftə</div>
                    <div className={styles.statsSubNum}>{thisWeek}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search + filter */}
            <div className={styles.searchRow}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}><SearchIcon /></span>
                <input
                  className={styles.searchInput}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Elanlar arasında axtarın…"
                />
              </div>
              <div className={styles.filterPills}>
                {cats.map(c => (
                  <button
                    key={c}
                    className={`${styles.pill} ${cat === c ? styles.pillActive : ""}`}
                    onClick={() => setCat(c)}
                  >
                    {c === "all" ? "Hamısı" : c}
                    <span className={styles.pillCount}>
                      {c === "all" ? announcements.length : announcements.filter(a => getCategory(a) === c).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pinned strip ── */}
        {pinned.length > 0 && cat === "all" && !q && (
          <section className={styles.pinnedSection}>
            <div className="mmu-container">
              <div className={styles.pinnedLabel}>
                <PinIcon w={14} h={14} />
                Sancılmış elanlar
              </div>
              <div className={styles.pinnedGrid}>
                {pinned.map(a => (
                  <div key={a.id} className={styles.pinnedCard} onClick={() => setOpen(a)}>
                    <div className={styles.pinnedIcon}>
                      <PinIcon w={20} h={20} />
                    </div>
                    <div className={styles.pinnedContent}>
                      <div className={styles.pinnedMeta}>
                        <span className="badge">{getCategory(a)}</span>
                        <span className={styles.pinnedDate}>{fmtDate(a.created_at)}</span>
                      </div>
                      <div className={styles.pinnedTitle}>{a.title}</div>
                      <p className={styles.pinnedSummary}>{a.description || a.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Main: timeline + sidebar ── */}
        <section className={styles.mainSection}>
          <div className="mmu-container">
            {loading ? (
              <div className={styles.loader}><div className={styles.spinner} /></div>
            ) : (
              <div className={styles.contentGrid}>

                {/* Left: timeline */}
                <div>
                  {filtered.length === 0 ? (
                    <div className={styles.empty}>
                      <div className={styles.emptyIcon}><MegaphoneIcon w={24} h={24} /></div>
                      <h3 style={{ fontSize: 20, marginBottom: 8 }}>Elan tapılmadı</h3>
                      <p style={{ color: "var(--muted)" }}>Axtarış parametrlərini dəyişməyi sınayın.</p>
                    </div>
                  ) : (
                    <div className={styles.timeline}>
                      <div className={styles.timelineLine} />
                      <div className={styles.timelineList}>
                        {filtered
                          .filter(a => !(isPinned(a) && cat === "all" && !q))
                          .map(a => (
                            <div key={a.id} className={styles.timelineItem}>
                              <div className={`${styles.timelineDot} ${isUrgent(a) ? styles.urgent : ""}`} />
                              <div className={styles.annCard} onClick={() => setOpen(a)}>
                                <div className={styles.annCardMeta}>
                                  <CatBadge label={getCategory(a)} urgent={isUrgent(a)} />
                                  {isUrgent(a) && (
                                    <span className={styles.urgentLabel}>● Vacib</span>
                                  )}
                                  {isPinned(a) && (
                                    <PinIcon w={14} h={14} style={{ color: "var(--accent-deep)" }} />
                                  )}
                                  <span className={styles.annDate}>{fmtDate(a.created_at)}</span>
                                </div>

                                <h3 className={styles.annTitle}>{a.title}</h3>

                                {a.image && (
                                  <img
                                    src={formatServerFilePath(a.image)}
                                    alt={a.title}
                                    className={styles.annImage}
                                  />
                                )}

                                <p className={styles.annDesc}>{a.description || a.summary}</p>

                                <div className={styles.annFooter}>
                                  <div className={styles.annAuthor}>
                                    <div className={styles.authorAvatar}>
                                      {initials(getAuthor(a))}
                                    </div>
                                    {getAuthor(a)}
                                  </div>
                                  <button className={styles.annReadMore}>
                                    Ətraflı oxu <ArrowIcon />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: sidebar */}
                <aside className={styles.sidebar}>

                  {/* Subscribe card */}
                  <div className={styles.subscribeCard}>
                    <BellIcon />
                    <div className={styles.subscribeTitle} style={{ marginTop: 10 }}>
                      Bildirişləri aktiv et
                    </div>
                    <p className={styles.subscribeDesc}>
                      Yeni elanlar haqqında e-poçtla məlumatlandırılın.
                    </p>
                    <button className={styles.subscribeBtn}>Abunə ol</button>
                  </div>

                  {/* Popular tags */}
                  {popularTags.length > 0 && (
                    <div className={styles.sideCard}>
                      <div className={styles.sideTitle}>Populyar etiketlər</div>
                      <div className={styles.tagCloud}>
                        {popularTags.map(t => (
                          <button
                            key={t}
                            className={styles.tagChip}
                            onClick={() => { setCat(t === cat ? "all" : t); }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming event */}
                  {upcomingEvent && (
                    <div className={styles.sideCard}>
                      <div className={styles.sideTitle}>Yaxınlaşan tədbir</div>
                      <div className={styles.eventCard}>
                        <div className={styles.eventDate}>
                          <div className={styles.eventMonth}>
                            {new Date(upcomingEvent.created_at).toLocaleString("az", { month: "short" })}
                          </div>
                          <div className={styles.eventDay}>
                            {new Date(upcomingEvent.created_at).getDate()}
                          </div>
                        </div>
                        <div>
                          <div className={styles.eventTitle}>{upcomingEvent.title}</div>
                          <div className={styles.eventTime}>
                            <ClockIcon />
                            {new Date(upcomingEvent.created_at).toLocaleTimeString("az", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </aside>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* ── Modal ── */}
      {open && <AnnModal ann={open} onClose={() => setOpen(null)} getCategory={getCategory} isPinned={isPinned} isUrgent={isUrgent} getAuthor={getAuthor} />}

      <Footer />
    </>
  );
}

/* ── Detail Modal ── */
function AnnModal({ ann, onClose, getCategory, isPinned, isUrgent, getAuthor }) {
  const urgent = isUrgent(ann);
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={`${styles.modalHeader} ${urgent ? styles.urgent : ""}`}>
          <button className={styles.modalClose} onClick={onClose}><XIcon /></button>
          <div className={styles.modalMeta}>
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "4px 10px", borderRadius: "999px", fontSize: 12, fontWeight: 600,
              background: "rgba(255,255,255,.2)", color: "#fff", border: 0,
            }}>{getCategory(ann)}</span>
            {isPinned(ann) && (
              <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, display: "flex", alignItems: "center", gap: 4, color: "#fff" }}>
                <PinIcon w={12} h={12} /> Sancılıb
              </span>
            )}
            <span style={{ marginLeft: "auto", fontSize: 13, opacity: 0.75, color: "rgba(255,255,255,.75)" }}>
              {new Date(ann.created_at).toLocaleDateString("az")}
            </span>
          </div>
          <h2 className={styles.modalTitle}>{ann.title}</h2>
          <div className={styles.modalBy}>
            Yayımlayan: <strong style={{ color: "#fff" }}>{getAuthor(ann)}</strong>
          </div>
        </div>

        <div className={styles.modalBody}>
          {ann.image && (
            <img
              src={formatServerFilePath(ann.image)}
              alt={ann.title}
              className={styles.modalImage}
            />
          )}
          <p className={styles.modalText}>{ann.description || ann.summary}</p>
          <p className={styles.modalText} style={{ fontSize: 14, color: "var(--muted)" }}>
            Əlavə təfərrüatlar üçün universitet daxili müraciət edə bilərsiniz.{" "}
            Bütün suallar üçün{" "}
            <a href="mailto:kitabxana@mmu.edu.az" style={{ color: "var(--navy)", fontWeight: 600, textDecoration: "underline" }}>
              kitabxana@mmu.edu.az
            </a>{" "}
            ünvanına yaza bilərsiniz.
          </p>
          <div className={styles.modalActions}>
            <button className="mmu-btn mmu-btn-primary" onClick={onClose}>Bağla</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementsPage;
