import { useNavigate } from "react-router-dom";
import bgImage from "./../../Assets/heroImage.jpg";
import styles from "./index.module.scss";
import { useContext, useEffect, useState } from "react";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import Footer from "../../Layouts/Footer";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CategoryIcon from "@mui/icons-material/Category";
import CampaignIcon from "@mui/icons-material/Campaign";
import DownloadIcon from "@mui/icons-material/Download";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonIcon from "@mui/icons-material/Person";
import AdSpace from "../../Components/AdSpace";

function HomePage() {
  const navigator = useNavigate();
  const store = useContext(dataContext);
  const [library, setLibrary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ pdfs: 0, categories: 0, announcements: 0, downloads: 0 });
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "MMU Kitabxana";
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      store.user.setData(null);
    } else {
      axios
        .get(Base_Url_Server + "users/" + userID, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => store.user.setData(res.data.data.user))
        .catch((error) => {
          if (error.response?.status === 401) {
            store.user.setData(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // PDFs
    axios
      .get(Base_Url_Server + "pdfs?limit=3", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        setLibrary(res.data.data.pdfs);
        setStats((s) => ({
          ...s,
          pdfs: res.data.data.pagination?.total || 0,
          downloads: res.data.data.pagination?.totalDownloads || 0,
        }));
      });
    // Categories
    axios.get(Base_Url_Server + "categories/pdfs").then((res) => {
      const cats = res.data.data.categories || [];
      setCategories(cats);
      setStats((s) => ({ ...s, categories: cats.length }));
    });
    // Announcements
    axios.get(Base_Url_Server + "announcements").then((res) => {
      setStats((s) => ({ ...s, announcements: (res.data.data.announcements || []).length }));
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigator(`/library/all${search ? `?search=${encodeURIComponent(search)}` : ""}`);
  };

  const statCards = [
    { icon: <MenuBookIcon />, value: stats.pdfs,          label: "PDF fondu",     color: "#1565c0" },
    { icon: <CategoryIcon />, value: stats.categories,    label: "Kateqoriya",    color: "#2e7d32" },
    { icon: <CampaignIcon />, value: stats.announcements, label: "Aktiv elan",    color: "#e65100" },
    { icon: <DownloadIcon />, value: stats.downloads,     label: "Yüklənmə",      color: "#6a1b9a" },
  ];

  const quickLinks = [
    { icon: <SearchIcon />,   label: "PDF Axtar",  path: "/library/all" },
    { icon: <MenuBookIcon />, label: "Kitabxana",  path: "/library" },
    { icon: <CampaignIcon />, label: "Elanlar",    path: "/news" },
    {
      icon: <PersonIcon />,
      label: store.user.data ? "Profilim" : "Daxil ol",
      path: store.user.data ? "/profile" : "/login",
    },
  ];

  const chipClass = (i) => styles[`chip${i % 7}`];

  return (
    <>
      <main>
        {/* ── HERO ── */}
        <section className={styles.hero}>
          <img src={bgImage} alt="hero" className={styles.heroBg} />
          <div className={styles.heroInner}>
            <div className={styles.mainCard}>

              {/* Sol sarı panel */}
              <div className={styles.leftPanel}>
                <h1 className={styles.heroTitle}>Biliklərə açılan qapınız!</h1>
                <p className={styles.heroSubtitle}>
                  Kitabxanamızda minlərlə PDF, jurnal və rəqəmsal resurs sizi gözləyir.
                </p>

                {/* Axtarış */}
                <form className={styles.searchBar} onSubmit={handleSearch}>
                  <SearchIcon className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Kitab, müəllif və ya açar söz axtarın..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button type="submit">Axtar</button>
                </form>

                {/* Statistika */}
                <div className={styles.statsRow}>
                  {statCards.map((s, i) => (
                    <div key={i} className={styles.statCard}>
                      <div className={styles.statIcon} style={{ color: s.color }}>{s.icon}</div>
                      <div className={styles.statValue}>{s.value.toLocaleString()}</div>
                      <div className={styles.statLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Kateqoriyalar */}
                {categories.length > 0 && (
                  <div className={styles.categoriesSection}>
                    <span className={styles.categoriesTitle}>Populyar kateqoriyalar</span>
                    <div className={styles.categoryChips}>
                      {categories.map((cat, i) => (
                        <button
                          key={cat.id}
                          className={`${styles.chip} ${chipClass(i)}`}
                          onClick={() => navigator(`/library/category/${cat.id}`)}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sağ ağ panel */}
              <div className={styles.rightPanel}>
                {/* Təklif kartı */}
                <div className={styles.offerCard}>
                  <div className={styles.offerEmoji}>🎓</div>
                  <div className={styles.offerContent}>
                    <h3>MMU-ya xoş gəldiniz!</h3>
                    <p>Bütün PDF-lər, elanlar və kitabxana xidmətlərindən <strong>pulsuz</strong> istifadə edin.</p>
                  </div>
                </div>

                {/* Sürətli keçidlər */}
                <div className={styles.quickLinks}>
                  <h3>Sürətli əməliyyatlar</h3>
                  <ul>
                    {quickLinks.map((link, i) => (
                      <li key={i} onClick={() => navigator(link.path)}>
                        <span className={styles.qlIcon}>{link.icon}</span>
                        <span className={styles.qlLabel}>{link.label}</span>
                        <ChevronRightIcon className={styles.qlArrow} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        <AdSpace position="home-hero-bottom" />

        {/* ── Son PDF-lər ── */}
        <section className={`${styles.library} ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.hr} />
            <h2>Son PDF-lər</h2>
            <div className={styles.hr} />
          </div>
          <div className={styles.container}>
            {library ? (
              library.map((e) => (
                <div
                  key={e.id}
                  className={styles.card}
                  onClick={() => navigator(`/library/${e.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.cardImage}>
                      {e.image_path ? (
                        <img
                          src={formatServerFilePath(e.image_path)}
                          alt={e.title}
                          onError={(ev) => { ev.target.src = bgImage; }}
                        />
                      ) : (
                        <div className={styles.noImage}>Şəkil yoxdur</div>
                      )}
                    </div>
                    <div className={styles.cardHeader}>
                      <h2><span>{e.title}</span></h2>
                      <h5>
                        {e.description?.length <= 200
                          ? e.description
                          : e.description?.slice(0, 200) + "..."}
                      </h5>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardInfo}>
                        <span>{e.created_at?.split("T")[0].replaceAll("-", "/")}</span>
                        <span>{e.category?.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.loader}><CircularProgress /></div>
            )}
          </div>
          <div className={styles.sectionFooter}>
            <span onClick={() => navigator("/library/all")}>Daha çox</span>
          </div>
        </section>

        <AdSpace position="home-library-bottom" />
      </main>
      <Footer />
    </>
  );
}

export default HomePage;
