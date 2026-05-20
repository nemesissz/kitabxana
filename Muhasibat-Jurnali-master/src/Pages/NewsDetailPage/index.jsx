import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import styles from "./index.module.scss";
import Footer from "../../Layouts/Footer";

function NewsDetailPage() {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const formatDate = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      return `${dt.getDate().toString().padStart(2, "0")}.${(dt.getMonth() + 1).toString().padStart(2, "0")}.${dt.getFullYear()}`;
    } catch { return ""; }
  };

  useEffect(() => {
    // Fast path: data passed via navigation state (from NewsPage card click)
    const stateAnn = location.state?.announcement;
    if (stateAnn) {
      setNews(stateAnn);
      document.title = `${stateAnn.title} — MMU Kitabxana`;
      setLoading(false);
      return;
    }

    if (!id) { setError("ID tapılmadı"); setLoading(false); return; }

    const tryFetch = async () => {
      try {
        const res = await axios.get(Base_Url_Server + `announcements/${id}`);
        const data = res.data?.data?.announcement || res.data?.data?.news;
        if (data) { setNews(data); document.title = `${data.title} — MMU Kitabxana`; return; }
      } catch {}
      setError("Elan tapılmadı");
    };
    tryFetch().finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className={styles.stateWrap}>
      <div className={styles.spinner} />
      <p>Yüklənir…</p>
    </div>
  );

  if (error || !news) return (
    <div className={styles.stateWrap}>
      <h2>Xəta</h2>
      <p>{error || "Elan tapılmadı"}</p>
      <button className="mmu-btn mmu-btn-primary" onClick={() => navigate("/news")}>Geri</button>
    </div>
  );

  return (
    <>
      <main>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className="mmu-container">
            <nav className={styles.crumb}>
              <button onClick={() => navigate("/")}>Ana səhifə</button>
              <span>/</span>
              <button onClick={() => navigate("/news")}>Elanlar</button>
              <span>/</span>
              <span>{news.title}</span>
            </nav>
            <div className={styles.heroBadges}>
              <span className={`${styles.priorityChip} ${news.priority === "urgent" ? styles.chipUrgent : styles.chipNormal}`}>
                {news.priority === "urgent" ? "Təcili" : "Normal"}
              </span>
            </div>
            <h1 className={styles.heroTitle}>{news.title}</h1>
            {news.created_at && (
              <p className={styles.heroDate}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {formatDate(news.created_at)}
              </p>
            )}
          </div>
        </section>

        {/* ── Body ── */}
        <section className={styles.body}>
          <div className="mmu-container">
            <div className={styles.layout}>

              {/* Main column */}
              <div className={styles.mainCol}>
                {news.image && (
                  <div className={styles.imgWrap}>
                    <img
                      src={news.image}
                      alt={news.title}
                      onError={(e) => { e.target.parentElement.style.display = "none"; }}
                    />
                  </div>
                )}

                {news.description && (
                  <p className={styles.lead}>{news.description}</p>
                )}

                {news.content && (
                  <div className={styles.content}>
                    <p>{news.content}</p>
                  </div>
                )}

                <div className={styles.backRow}>
                  <button
                    className="mmu-btn mmu-btn-outline mmu-btn-sm"
                    onClick={() => navigate("/news")}
                  >
                    ← Elanlar siyahısı
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <aside className={styles.aside}>
                <div className={styles.infoCard}>
                  <h4>Elan məlumatları</h4>
                  {[
                    { l: "Tarix", v: formatDate(news.created_at) },
                    { l: "Prioritet", v: news.priority === "urgent" ? "Təcili" : "Normal" },
                  ].filter(({ v }) => v).map(({ l, v }) => (
                    <div key={l} className={styles.infoRow}>
                      <span className={styles.infoKey}>{l}</span>
                      <span className={styles.infoVal}>{v}</span>
                    </div>
                  ))}
                </div>
              </aside>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default NewsDetailPage;
