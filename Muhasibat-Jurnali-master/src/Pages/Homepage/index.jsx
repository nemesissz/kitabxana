import { useNavigate } from "react-router-dom";
import styles from "./index.module.scss";
import { useContext, useEffect, useState } from "react";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import BookCover from "../../Components/BookCover";
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
  const [collagePdfs, setCollagePdfs] = useState([]);
  const [typeStats, setTypeStats] = useState([]);
  const [globalStats, setGlobalStats] = useState({ downloads: 0 });
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

    // Collage PDFs — superadmin tərəfindən seçilmiş və ya avtomatik popular
    axios
      .get(Base_Url_Server + "settings/homepage-collage", { headers })
      .then((res) => setCollagePdfs(res.data.data.pdfs || []))
      .catch(() => {});

    // Ümumi statistika (baxış + yükləmə)
    axios.get(Base_Url_Server + "pdfs?status=approved&limit=1")
      .then(r => {
        const p = r.data.data.pagination || {};
        setGlobalStats({ downloads: p.totalDownloads || 0 });
      })
      .catch(() => {});

    // PDF tipi statistikası
    axios.get(Base_Url_Server + "pdfs-types")
      .then((res) => {
        const types = res.data.data.types || [];
        Promise.all(
          types.map(t =>
            axios.get(Base_Url_Server + `pdfs?pdfTypeId=${t.id}&status=approved&limit=1`)
              .then(r => ({ typeId: t.id, label: t.name, count: r.data.data.pagination?.total || 0 }))
              .catch(() => ({ typeId: t.id, label: t.name, count: 0 }))
          )
        ).then(stats => setTypeStats(stats.filter(s => s.count > 0)));
      })
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
              <h1 className={styles.heroTitle}>
                Biliklərə<br />
                <span className={styles.heroAccent}>açılan qapınız.</span>
              </h1>
              <p className={styles.heroDesc}>
                Minlərlə PDF, jurnal və rəqəmsal akademik resurs — bir yerdə.
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

              {/* Statistika */}
              {(typeStats.length > 0 || globalStats.downloads > 0) && (
                <div className={styles.inlineStats}>
                  {typeStats.map((s, i) => (
                    <>
                      <div
                        key={s.typeId}
                        className={styles.inlineStat}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigator(`/library/all?pdfTypeId=${s.typeId}`)}
                      >
                        <div className={styles.inlineStatN}>{s.count.toLocaleString()}</div>
                        <div className={styles.inlineStatL}>{s.label}</div>
                      </div>
                      {i === typeStats.length - 1 && globalStats.downloads > 0 && (
                        <div className={styles.inlineStatDivider} />
                      )}
                    </>
                  ))}
                  {globalStats.downloads > 0 && (
                    <div className={styles.inlineStat}>
                      <div className={styles.inlineStatN}>{globalStats.downloads.toLocaleString()}</div>
                      <div className={styles.inlineStatL}>Ümumi yükləmə</div>
                    </div>
                  )}
                </div>
              )}

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

            </div>

          </div>
        </section>


      </main>
    </>
  );
}

export default HomePage;
