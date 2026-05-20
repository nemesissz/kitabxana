import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import Footer from "../../Layouts/Footer";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate, useSearchParams } from "react-router-dom";
import BookCard from "../../Components/BookCard";
import Swal from "sweetalert2";

function LibraryPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [language, setLanguage] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);

  // selectedCat is derived directly from URL — single source of truth
  const selectedCat = searchParams.get("category") || "";

  const selectCat = (id) => {
    setPage(1);
    if (id) setSearchParams({ category: String(id) });
    else setSearchParams({});
  };

  useEffect(() => {
    document.title = "Kitabxana";
    axios.get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoading(true);
    const params = { status: "approved", limit: 18, page, sortBy };
    if (search.trim()) params.search = search.trim();
    if (selectedCat) params.categoryId = selectedCat;
    if (language) params.language = language;

    axios
      .get(Base_Url_Server + "pdfs", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      })
      .then((res) => {
        setPdfs(res.data.data.pdfs || []);
        setPagination({
          total: res.data.data.pagination?.total || 0,
          page: res.data.data.pagination?.page || 1,
          totalPages: res.data.data.pagination?.totalPages || 1,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCat, search, sortBy, page, language]);

  const user = store.user.data;
  const activeCatName = selectedCat
    ? categories.find((c) => String(c.id) === String(selectedCat))?.name || ""
    : "";

  const countText = loading
    ? "Yüklənir…"
    : `${pagination.total} resurs — ${activeCatName || "bütün kateqoriyalarda"}.`;

  const hasFilter = search || selectedCat || language;

  return (
    <>
      <main style={{ padding: "40px 0 0" }}>
        <div className={`mmu-container ${styles.layout}`}>

          {/* ── Sidebar ── */}
          <aside className={styles.sidebar}>
            <div className={styles.sideSection}>
              <div className={styles.sideLabel}>KATEQORİYA</div>
              <div className={styles.catList}>
                <button
                  className={`${styles.catItem} ${!selectedCat ? styles.catItemActive : ""}`}
                  onClick={() => selectCat("")}
                >
                  <span>Hamısı</span>
                  {!loading && <span className={styles.catCount}>{pagination.total}</span>}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.catItem} ${String(selectedCat) === String(c.id) ? styles.catItemActive : ""}`}
                    onClick={() => selectCat(c.id)}
                  >
                    <span>{c.name}</span>
                    {c.count !== undefined && (
                      <span className={styles.catCount}>{c.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sideSection}>
              <div className={styles.sideLabel}>DİL</div>
              <div className={styles.langPills}>
                {[
                  { val: "", label: "Hamısı" },
                  { val: "az", label: "AZ" },
                  { val: "en", label: "EN" },
                  { val: "ru", label: "RU" },
                ].map((l) => (
                  <button
                    key={l.val}
                    className={`${styles.langPill} ${language === l.val ? styles.langPillActive : ""}`}
                    onClick={() => { setLanguage(l.val); setPage(1); }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {user && (
              <button
                className="mmu-btn mmu-btn-primary mmu-btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  if (!user.uploadPermission || user.uploadPermission === "none") {
                    Swal.fire({ icon: "warning", title: "İcazə yoxdur", text: "Bu funksiya üçün rolunuz uyğun deyil.", confirmButtonColor: "#0B1F3D" });
                    return;
                  }
                  navigate("/library/submit");
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9m0 0 5 5m-5-5-5 5"/><path d="M5 3h14"/></svg>
                PDF Yüklə
              </button>
            )}
          </aside>

          {/* ── Main area ── */}
          <div className={styles.mainArea}>
            {/* Result count */}
            <p className={styles.resultCount}>{countText}</p>

            {/* Filter bar */}
            <form className={styles.filterBar} onSubmit={(e) => e.preventDefault()}>
              <div className={styles.searchWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
                </svg>
                <input
                  className={styles.searchField}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Başlıq və ya müəllifə görə axtarın…"
                />
                {search && (
                  <button type="button" className={styles.clearBtn} onClick={() => { setSearch(""); setPage(1); }}>
                    ✕
                  </button>
                )}
              </div>

              <select
                className={`mmu-input mmu-select ${styles.filterSelect}`}
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="recent">Ən yeni</option>
                <option value="downloads">Ən populyar</option>
                <option value="title">A–Z</option>
              </select>

              <div className={styles.viewToggle}>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${view === "grid" ? styles.viewBtnActive : ""}`}
                  onClick={() => setView("grid")}
                  title="Grid"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className={`${styles.viewBtn} ${view === "list" ? styles.viewBtnActive : ""}`}
                  onClick={() => setView("list")}
                  title="List"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                  </svg>
                </button>
              </div>
            </form>

            {/* Active filters */}
            <div className={styles.activeFilters}>
              <span className={styles.activeLabel}>AKTİV:</span>
              {!hasFilter && (
                <span style={{ fontSize: 12, color: "var(--muted-2)" }}>filter yoxdur</span>
              )}
              {search && (
                <span className={styles.activeTag}>
                  "{search}"
                  <button onClick={() => { setSearch(""); setPage(1); }}>✕</button>
                </span>
              )}
              {selectedCat && (
                <span className={styles.activeTag}>
                  {activeCatName}
                  <button onClick={() => selectCat("")}>✕</button>
                </span>
              )}
              {language && (
                <span className={styles.activeTag}>
                  {language.toUpperCase()}
                  <button onClick={() => { setLanguage(""); setPage(1); }}>✕</button>
                </span>
              )}
            </div>

            {/* Results */}
            {loading ? (
              <div className={styles.loader}>
                <div className={styles.spinner} />
              </div>
            ) : pdfs.length === 0 ? (
              <div className={styles.empty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", margin: "0 auto 12px", display: "block" }}>
                  <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                </svg>
                <p>Heç bir nəticə tapılmadı.</p>
              </div>
            ) : view === "grid" ? (
              <div className={styles.grid}>
                {pdfs.map((pdf) => <BookCard key={pdf.id} pdf={pdf} view="grid" />)}
              </div>
            ) : (
              <div className={styles.list}>
                {pdfs.map((pdf) => <BookCard key={pdf.id} pdf={pdf} view="list" />)}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className="mmu-btn mmu-btn-outline mmu-btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >← Əvvəlki</button>
                <span className={styles.pageInfo}>{page} / {pagination.totalPages}</span>
                <button
                  className="mmu-btn mmu-btn-outline mmu-btn-sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >Növbəti →</button>
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

export default LibraryPage;
