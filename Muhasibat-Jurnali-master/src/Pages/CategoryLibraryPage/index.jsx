import { useContext, useEffect, useState, useMemo } from "react";
import styles from "./index.module.scss";
import Footer from "../../Layouts/Footer";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate, useParams } from "react-router-dom";
import BookCard from "../../Components/BookCard";
import BookCover from "../../Components/BookCover";
import { displayCategoryName } from "../../Constants/categoryDisplay";

const monthNames = [
  "Yanvar", "Fevral", "Mart", "Aprel",
  "May", "İyun", "İyul", "Avqust",
  "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

const allMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function CategoryLibraryPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [loader, setLoader] = useState(false);
  const [allPdfs, setAllPdfs] = useState([]);
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [language, setLanguage] = useState("");
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  const handleReset = () => {
    setSearch(""); setStartDate(""); setEndDate("");
    setMin(""); setMax(""); setLanguage("");
  };


  useEffect(() => {
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
    if (!categoryId) return;
    axios
      .get(Base_Url_Server + "categories/pdfs/" + categoryId)
      .then((res) => {
        const cat = res.data.data.category;
        if (cat?.display_type !== "tax-journal") {
          navigate(`/library?category=${categoryId}`, { replace: true });
          return;
        }
        setCategory(cat);
        document.title = displayCategoryName(cat.name) || "Kitabxana";
      })
      .catch(() => navigate("/"));
  }, [categoryId, navigate]);

  useEffect(() => {
    if (!categoryId) return;
    setLoader(true);
    const token = localStorage.getItem("token");
    const fetchAll = async () => {
      try {
        let collected = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const res = await axios.get(
            Base_Url_Server +
              `pdfs?page=${page}&limit=100&search=${search}&language=${language}&categoryId=${categoryId}&minPrice=${min}&maxPrice=${max}&startDate=${startDate}&endDate=${endDate}`,
            token ? { headers: { Authorization: `Bearer ${token}` } } : {}
          );
          const pdfs = res.data.data.pdfs || [];
          const pagination = res.data.data.pagination || {};
          collected = [...collected, ...pdfs];
          if (pagination.current_page >= pagination.total_pages || pdfs.length === 0) hasMore = false;
          else page++;
        }
        setAllPdfs(collected);
      } catch {
        // silent
      } finally {
        setLoader(false);
      }
    };
    fetchAll();
  }, [search, categoryId, min, max, endDate, startDate, language]);

  const pdfsByYearAndMonth = useMemo(() => {
    if (category?.display_type !== "tax-journal") return {};
    const grouped = {};
    allPdfs.forEach((pdf) => {
      const date = new Date(pdf.pdfDate || pdf.created_at);
      if (isNaN(date.getTime())) return;
      const y = date.getFullYear();
      const m = date.getMonth();
      if (!grouped[y]) grouped[y] = {};
      if (!grouped[y][m]) grouped[y][m] = [];
      grouped[y][m].push(pdf);
    });
    Object.keys(grouped).forEach((y) =>
      Object.keys(grouped[y]).forEach((m) =>
        grouped[y][m].sort(
          (a, b) => new Date(a.pdfDate || a.created_at) - new Date(b.pdfDate || b.created_at)
        )
      )
    );
    return grouped;
  }, [allPdfs, category]);

  const filteredPdfs = useMemo(() => {
    if (category?.display_type !== "tax-journal") return {};
    if (!selectedYear || !pdfsByYearAndMonth[selectedYear]) return {};
    return pdfsByYearAndMonth[selectedYear];
  }, [pdfsByYearAndMonth, selectedYear, category]);


  useEffect(() => {
    if (category?.display_type === "tax-journal" && allPdfs.length > 0) {
      const years = new Set();
      allPdfs.forEach((pdf) => {
        const date = new Date(pdf.pdfDate || pdf.created_at);
        if (!isNaN(date.getTime())) years.add(date.getFullYear());
      });
      const sorted = Array.from(years).sort((a, b) => a - b);
      setAvailableYears(sorted.length > 0 ? sorted : [new Date().getFullYear()]);
    }
  }, [category, allPdfs]);

  useEffect(() => {
    if (category?.display_type === "tax-journal" && availableYears.length > 0) {
      if (selectedYear === null || !availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0]);
      }
    }
  }, [availableYears, selectedYear, category]);

  const sortedYears = useMemo(() => [...availableYears].sort((a, b) => a - b), [availableYears]);
  const yearIndex = selectedYear !== null ? sortedYears.indexOf(selectedYear) : -1;

  const getPdfsForMonth = (m) => filteredPdfs[m]?.slice(0, 2) || [];

  const hasActiveFilter = search || startDate || endDate || language || min || max;

  if (!category) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <>
      <main>
        {/* Hero */}
        <section className={styles.heroStrip}>
          <div className="mmu-container">
            <span className="mmu-eyebrow">Kateqoriya</span>
            <div className={styles.heroRow}>
              <h1 className={styles.heroTitle}>{displayCategoryName(category.name)}</h1>
            </div>
          </div>
        </section>

        <div className="mmu-container" style={{ paddingBottom: 60 }}>
          {/* Filter bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", flexShrink: 0 }}>
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                className={styles.searchField}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Axtar…"
              />
            </div>
            <input
              type="date"
              className="mmu-input"
              style={{ fontSize: 13, width: "auto", flexShrink: 0 }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="mmu-input"
              style={{ fontSize: 13, width: "auto", flexShrink: 0 }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <select className="mmu-select" style={{ width: "auto", flexShrink: 0 }} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">Bütün dillər</option>
              <option value="az">Azərbaycan</option>
              <option value="ru">Rusca</option>
            </select>
            {hasActiveFilter && (
              <button className="mmu-btn mmu-btn-ghost mmu-btn-sm" onClick={handleReset}>
                Sıfırla
              </button>
            )}
          </div>

          {/* Year navigation (tax-journal only) */}
          {category.display_type === "tax-journal" && availableYears.length > 0 && (
            <div className={styles.yearNav}>
              <button
                className={styles.yearArrow}
                onClick={() => yearIndex > 0 && setSelectedYear(sortedYears[yearIndex - 1])}
                disabled={yearIndex <= 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
              <div className={styles.yearList}>
                {sortedYears.map((year) => (
                  <button
                    key={year}
                    className={`${styles.yearBtn} ${selectedYear === year ? styles.yearBtnActive : ""}`}
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
              <button
                className={styles.yearArrow}
                onClick={() => yearIndex < sortedYears.length - 1 && setSelectedYear(sortedYears[yearIndex + 1])}
                disabled={yearIndex >= sortedYears.length - 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}

          {/* Loading state */}
          {loader ? (
            <div className={styles.loader}>
              <div className={styles.spinner} />
            </div>
          ) : category.display_type === "tax-journal" && availableYears.length > 0 && selectedYear ? (
            /* Tax-journal: month grid */
            <div className={styles.months}>
              {allMonths.map((monthIndex) => {
                const monthPdfs = getPdfsForMonth(monthIndex);
                return (
                  <div key={monthIndex} className={styles.monthSection}>
                    <div className={styles.monthLabel}>{monthNames[monthIndex]}</div>
                    <div className={styles.monthCards}>
                      {monthPdfs.length > 0 ? (
                        monthPdfs.map((pdf) => (
                          <div
                            key={pdf.id}
                            className={styles.pdfCard}
                            onClick={() => navigate(`/library/${pdf.id}`)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className={styles.pdfCover}>
                              <BookCover pdf={pdf} />
                            </div>
                            <div className={styles.pdfBody}>
                              <div className={styles.pdfTitle}>{pdf.title}</div>
                              <div className={styles.pdfMeta}>
                                {new Date(pdf.pdfDate || pdf.created_at).toLocaleDateString("az-AZ", {
                                  year: "numeric",
                                  month: "short",
                                })}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className={styles.monthEmpty}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : allPdfs.length > 0 ? (
            /* Fallback grid (other-books OR tax-journal with no parseable dates) */
            <div className={styles.grid}>
              {[...allPdfs]
                .sort((a, b) => new Date(b.pdfDate || b.created_at) - new Date(a.pdfDate || a.created_at))
                .map((pdf) => (
                  <BookCard key={pdf.id} pdf={pdf} view="grid" />
                ))}
            </div>
          ) : (
            <div className={styles.empty}>Bu kateqoriyada PDF tapılmadı</div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default CategoryLibraryPage;
