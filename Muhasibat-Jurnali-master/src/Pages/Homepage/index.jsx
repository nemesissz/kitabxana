import { useNavigate } from "react-router-dom";
import styles from "./index.module.scss";
import { useContext, useEffect, useState, useRef } from "react";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import Footer from "../../Layouts/Footer";
import BookCover from "../../Components/BookCover";
import FeaturedShelf from "../../Components/FeaturedShelf";
import { displayCategoryName } from "../../Constants/categoryDisplay";

const COLLAGE_TILES = [
  { x: "6%",  y: "6%",  w: 130, rot: -6, delay: 0   },
  { x: "31%", y: "2%",  w: 160, rot: 4,  delay: 0.4 },
  { x: "59%", y: "8%",  w: 140, rot: -3, delay: 0.2 },
  { x: "81%", y: "3%",  w: 118, rot: 8,  delay: 0.6 },
  { x: "3%",  y: "57%", w: 148, rot: 5,  delay: 0.3 },
  { x: "28%", y: "66%", w: 130, rot: -7, delay: 0.5 },
  { x: "56%", y: "61%", w: 168, rot: 6,  delay: 0.1 },
  { x: "81%", y: "57%", w: 132, rot: -4, delay: 0.7 },
];

function HomePage() {
  const navigator = useNavigate();
  const store = useContext(dataContext);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ pdfs: 0, categories: 0, downloads: 0, announcements: 0 });
  const [collagePdfs, setCollagePdfs] = useState([]);
  const [topPdfs, setTopPdfs] = useState([]);
  const [recentPdfs, setRecentPdfs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "MMU Kitabxana";
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      store.user.setData(null);
    } else {
      axios
        .get(Base_Url_Server + "users/" + userID, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => store.user.setData(res.data.data.user))
        .catch((err) => {
          if (err.response?.status === 401) {
            store.user.setData(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Stats (total PDFs, downloads) — popular sorğusundan
    axios
      .get(Base_Url_Server + "pdfs?limit=1&sortBy=popular&status=approved", { headers })
      .then((res) => {
        setStats((s) => ({
          ...s,
          pdfs: res.data.data.pagination?.total || 0,
          downloads: res.data.data.pagination?.totalDownloads || 0,
        }));
      })
      .catch(() => {});

    // Collage PDFs — superadmin tərəfindən seçilmiş və ya avtomatik popular
    axios
      .get(Base_Url_Server + "settings/homepage-collage", { headers })
      .then((res) => setCollagePdfs(res.data.data.pdfs || []))
      .catch(() => {});

    // Top PDFs for shelf
    axios
      .get(Base_Url_Server + "pdfs?limit=6&sortBy=popular&status=approved", { headers })
      .then((res) => setTopPdfs(res.data.data.pdfs || []))
      .catch(() => {});

    // Recent PDFs for shelf
    axios
      .get(Base_Url_Server + "pdfs?limit=6&sortBy=recent&status=approved", { headers })
      .then((res) => setRecentPdfs(res.data.data.pdfs || []))
      .catch(() => {});

    // Categories
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => {
        const cats = res.data.data.categories || [];
        setCategories(cats);
        setStats((s) => ({ ...s, categories: cats.length }));
      })
      .catch(() => {});

    // Announcements count
    axios
      .get(Base_Url_Server + "announcements")
      .then((res) => setStats((s) => ({ ...s, announcements: (res.data.data.announcements || []).length })))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigator(`/library/all${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  };

  return (
    <>
      <main>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={`${styles.heroInner} mmu-container`}>

            {/* Left */}
            <div className={styles.heroLeft}>
              <span className="mmu-eyebrow">MMU-ya xoş gəldiniz</span>
              <h1 className={styles.heroTitle}>
                Biliklərə<br />
                <span className={styles.heroAccent}>açılan qapınız.</span>
              </h1>
              <p className={styles.heroDesc}>
                Minlərlə PDF, jurnal və rəqəmsal akademik resurs — bir yerdə.{" "}
                <strong>Universitet daxilində pulsuz.</strong>
              </p>

              {/* Search */}
              <form className={styles.searchBox} onSubmit={handleSearch}>
                <div className={styles.searchInput}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
                  </svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Kitab, müəllif və ya açar söz axtarın…"
                  />
                </div>
                <button type="submit" className="mmu-btn mmu-btn-primary" style={{ flexShrink: 0 }}>
                  Axtar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                </button>
              </form>

              {/* Category tags */}
              {categories.length > 0 && (
                <div className={styles.tagRow}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>Populyar:</span>
                  {categories.slice(0, 5).map((cat) => (
                    <button
                      key={cat.id}
                      className="mmu-tag"
                      onClick={() => navigator(`/library?category=${cat.id}`)}
                    >
                      {displayCategoryName(cat.name)}
                    </button>
                  ))}
                </div>
              )}

              {/* Inline stats */}
              <div className={styles.inlineStats}>
                {[
                  { n: stats.pdfs ? `${stats.pdfs}+` : "—", l: "PDF resurs" },
                  { n: stats.categories || "—", l: "Kateqoriya" },
                  { n: stats.downloads ? `${stats.downloads}+` : "—", l: "Yüklənmə" },
                ].map((s, i) => (
                  <div key={i} className={styles.inlineStat}>
                    <div className={styles.inlineStatN}>{s.n}</div>
                    <div className={styles.inlineStatL}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — book collage */}
            <div className={styles.collage}>
              {/* Ambient blob */}
              <div className={styles.blob} />
              <div className={styles.blob2} />

              {/* Book tiles */}
              {COLLAGE_TILES.map((tile, i) => {
                const pdf = collagePdfs[i] || null;
                return (
                  <div
                    key={i}
                    className={styles.tile}
                    style={{
                      left: tile.x,
                      top: tile.y,
                      width: tile.w,
                      animationDelay: `${tile.delay}s`,
                      '--rot': `rotate(${tile.rot}deg)`,
                    }}
                    onClick={() => pdf && navigator(`/library/${pdf.id}`)}
                  >
                    <div className={styles.tileInner}>
                      {pdf ? <BookCover pdf={pdf} /> : (
                        <div style={{ width: "100%", height: "100%", background: "var(--paper-2)" }} />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Orbit ring */}
              <svg viewBox="0 0 400 400" className={styles.orbitRing}>
                <circle cx="200" cy="200" r="194" fill="none" stroke="var(--navy)" strokeWidth="1" strokeDasharray="2 6" opacity="0.15" />
              </svg>

              {/* Floating stat card */}
              {collagePdfs[0] && (
                <div className={`${styles.floatCard} mmu-card`}>
                  <div className={styles.floatCover}>
                    <BookCover pdf={collagePdfs[0]} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Ən populyar</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 2, maxWidth: 120, lineHeight: 1.3 }}>
                      {collagePdfs[0].title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                      {(() => {
                        const p = collagePdfs[0];
                        const cat = (p.pdf_type?.name || p.category_name || p.category?.name || "").toLowerCase();
                        const dl  = p.downloads || 0;
                        const rd  = p.reads || 0;
                        const rnt = p.rentals || 0;
                        const isFiziki   = cat.includes("fiziki") && !cat.includes("ikisi");
                        const isHerIkisi = cat.includes("ikisi");
                        if (isFiziki)   return `📚 ${rnt} kirayə`;
                        if (isHerIkisi) return `↓ ${dl} · 👁 ${rd} · 📚 ${rnt}`;
                        return `↓ ${dl} · 👁 ${rd}`;
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ── Stat band ── */}
        <section className={styles.statBand}>
          <div className="mmu-container">
            <div className={styles.statGrid}>
              {[
                { n: stats.pdfs, l: "PDF resurs", icon: "📚" },
                { n: stats.categories, l: "Kateqoriya", icon: "🗂" },
                { n: stats.downloads, l: "Ümumi yüklənmə", icon: "⬇️" },
                { n: stats.announcements, l: "Aktiv elan", icon: "📢" },
              ].map((s, i) => (
                <div key={i} className={styles.statCard}>
                  <span className={styles.statIcon}>{s.icon}</span>
                  <div className={styles.statN}>{s.n?.toLocaleString?.() ?? s.n}</div>
                  <div className={styles.statL}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured shelves ── */}
        <FeaturedShelf
          title="Ən çox yüklənənlər"
          subtitle="Bu ay icma tərəfindən ən populyar olan resurslar."
          eyebrow="Trend"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>}
          pdfs={topPdfs}
          viewAllPath="/library/all"
        />

        <FeaturedShelf
          title="Son əlavə olunanlar"
          subtitle="Kitabxana fonduna yenicə əlavə olunmuş PDF və mənbələr."
          eyebrow="Yeniliklər"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>}
          pdfs={recentPdfs}
          viewAllPath="/library/all"
        />

        {/* ── Category band ── */}
        {categories.length > 0 && (
          <section className={styles.catBand}>
            <div className="mmu-container">
              <div className="mmu-section-head">
                <div>
                  <span className="mmu-eyebrow">Kateqoriyalar</span>
                  <h2 style={{ marginTop: 10 }}>Resurs fondunu kəşf edin</h2>
                </div>
              </div>
              <div className={styles.catGrid}>
                {categories.map((cat, i) => (
                  <button
                    key={cat.id}
                    className={styles.catCard}
                    onClick={() => navigator(`/library?category=${cat.id}`)}
                  >
                    <span className={styles.catLabel}>{displayCategoryName(cat.name)}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
      <Footer />
    </>
  );
}

export default HomePage;
