import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import Footer from "../../Layouts/Footer";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate, useSearchParams } from "react-router-dom";
import BookCover from "../../Components/BookCover";
import Swal from "sweetalert2";
import { downloadPdf } from "../../Services/pdfService";
import { displayCategoryName } from "../../Constants/categoryDisplay";


function LibraryPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [pdfsTypes, setPdfsTypes] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [language, setLanguage] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);

  const selectedCat  = searchParams.get("category")   || "";
  const selectedType = searchParams.get("pdfTypeId")   || "";

  const setParam = (key, val) => {
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    setSearchParams(next);
  };

  useEffect(() => {
    document.title = "Kitabxana";
    axios.get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => {});
    axios.get(Base_Url_Server + "pdfs-types")
      .then((res) => setPdfsTypes(res.data.data.types || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoading(true);
    const params = { status: "approved", limit: 20, page, sortBy };
    if (search.trim())  params.search    = search.trim();
    if (selectedCat)    params.categoryId = selectedCat;
    if (selectedType)   params.pdfTypeId  = selectedType;
    if (language)       params.language   = language;

    axios
      .get(Base_Url_Server + "pdfs", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      })
      .then((res) => {
        setPdfs(res.data.data.pdfs || []);
        setPagination({
          total:      res.data.data.pagination?.total      || 0,
          page:       res.data.data.pagination?.current_page || 1,
          totalPages: res.data.data.pagination?.total_pages  || 1,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCat, selectedType, search, sortBy, page, language]);

  const user = store.user.data;

  const handleDownload = async (pdf) => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({ icon: "warning", title: "Giriş tələb olunur", text: "Yükləmək üçün daxil olun.", confirmButtonColor: "#0B1F3D" });
      return;
    }
    try {
      setDownloadingId(pdf.id);
      const blob = await downloadPdf(pdf.id, token);
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${pdf.title || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ icon: "error", title: "Xəta", text: "Yükləmə zamanı xəta baş verdi.", confirmButtonColor: "#0B1F3D" });
    } finally {
      setDownloadingId(null);
    }
  };

  const hasFilter = search || selectedCat || selectedType || language;
  const activeCatName  = selectedCat  ? displayCategoryName(categories.find(c => String(c.id) === selectedCat)?.name || "") : "";
  const activeTypeName = selectedType ? pdfsTypes.find(t => String(t.id) === selectedType)?.name || "" : "";

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
                  onClick={() => setParam("category", "")}
                >
                  <span>Hamısı</span>
                  {!loading && !selectedCat && <span className={styles.catCount}>{pagination.total}</span>}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.catItem} ${String(selectedCat) === String(c.id) ? styles.catItemActive : ""}`}
                    onClick={() => setParam("category", String(c.id))}
                  >
                    <span>{displayCategoryName(c.name)}</span>
                    {c.count !== undefined && <span className={styles.catCount}>{c.count}</span>}
                  </button>
                ))}
              </div>
            </div>

            {pdfsTypes.length > 0 && (
              <div className={styles.sideSection}>
                <div className={styles.sideLabel}>PDF TİPİ</div>
                <div className={styles.catList}>
                  <button
                    className={`${styles.catItem} ${!selectedType ? styles.catItemActive : ""}`}
                    onClick={() => setParam("pdfTypeId", "")}
                  >
                    <span>Hamısı</span>
                  </button>
                  {pdfsTypes.map((t) => (
                    <button
                      key={t.id}
                      className={`${styles.catItem} ${String(selectedType) === String(t.id) ? styles.catItemActive : ""}`}
                      onClick={() => setParam("pdfTypeId", String(t.id))}
                    >
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {/* Filter bar */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
                </svg>
                <input
                  className={styles.searchField}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Başlıq, müəllif və ya açar söz…"
                />
                {search && (
                  <button type="button" className={styles.clearBtn} onClick={() => { setSearch(""); setPage(1); }}>✕</button>
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
            </div>

            {/* Active filters */}
            {hasFilter && (
              <div className={styles.activeFilters}>
                <span className={styles.activeLabel}>FİLTR:</span>
                {search && (
                  <span className={styles.activeTag}>"{search}" <button onClick={() => { setSearch(""); setPage(1); }}>✕</button></span>
                )}
                {selectedCat && (
                  <span className={styles.activeTag}>{activeCatName} <button onClick={() => setParam("category", "")}>✕</button></span>
                )}
                {selectedType && (
                  <span className={styles.activeTag}>{activeTypeName} <button onClick={() => setParam("pdfTypeId", "")}>✕</button></span>
                )}
                {language && (
                  <span className={styles.activeTag}>{language.toUpperCase()} <button onClick={() => { setLanguage(""); setPage(1); }}>✕</button></span>
                )}
              </div>
            )}

            {/* Result count */}
            <p className={styles.resultCount}>
              {loading ? "Yüklənir…" : `${pagination.total} nəticə`}
            </p>

            {/* Table */}
            {loading ? (
              <div className={styles.loader}><div className={styles.spinner} /></div>
            ) : pdfs.length === 0 ? (
              <div className={styles.empty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)", margin: "0 auto 12px", display: "block" }}>
                  <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                </svg>
                <p>Heç bir nəticə tapılmadı.</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.thNum}>№</th>
                      <th className={styles.thCover}></th>
                      <th>Ad</th>
                      <th>Müəllif</th>
                      <th>Kateqoriya</th>
                      <th>Dil</th>
                      <th>Tip</th>
                      <th>Müəssisə / Rəf №</th>
                      <th className={styles.thActions}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdfs.map((pdf, idx) => {
                      const typeName   = (pdf.pdf_type?.name || "").toLowerCase();
                      const isHerIkisi = typeName.includes("çap") && typeName.includes("elektron");
                      const isFiziki   = typeName.includes("çap") && !isHerIkisi;
                      const isElektron = typeName.includes("elektron") && !isHerIkisi;
                      const showInst   = isFiziki || isHerIkisi;
                      const canDownload = !isFiziki && (pdf.allow_download === 1 || pdf.allow_download === "1" || pdf.allow_download === true);
                      const rowNum = (page - 1) * 20 + idx + 1;

                      return (
                        <tr key={pdf.id} className={styles.row} onClick={() => navigate(`/library/${pdf.id}`)}>
                          <td className={styles.tdNum}>{rowNum}</td>
                          <td className={styles.tdCover} onClick={e => e.stopPropagation()}>
                            <div className={styles.thumb} onClick={() => navigate(`/library/${pdf.id}`)}>
                              <BookCover pdf={pdf} />
                            </div>
                          </td>
                          <td className={styles.tdTitle}>
                            <span className={styles.title}>{pdf.title}</span>
                          </td>
                          <td className={styles.tdAuthor}>{pdf.author || <span className={styles.dash}>—</span>}</td>
                          <td className={styles.tdCat}>
                            {pdf.category?.name ? displayCategoryName(pdf.category.name) : <span className={styles.dash}>—</span>}
                          </td>
                          <td className={styles.tdLang}>
                            {pdf.language && (
                              <span className={styles.langBadge}>
                                {pdf.language_flag && <span>{pdf.language_flag}</span>}
                                {pdf.language.toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className={styles.tdType}>
                            {pdf.pdf_type?.name
                              ? <span className={styles.typeTag}>{pdf.pdf_type.name}</span>
                              : <span className={styles.dash}>—</span>
                            }
                          </td>
                          <td className={styles.tdInst}>
                            {showInst ? (
                              (pdf.institution_name || pdf.shelf_number)
                                ? <span>
                                    {pdf.institution_name || ""}
                                    {pdf.institution_name && pdf.shelf_number && " / "}
                                    {pdf.shelf_number || ""}
                                  </span>
                                : <span className={styles.dash}>—</span>
                            ) : <span className={styles.dash}>—</span>}
                          </td>
                          <td className={styles.tdActions} onClick={e => e.stopPropagation()}>
                            <button
                              className={styles.btnRead}
                              onClick={() => navigate(`/library/${pdf.id}`)}
                              title="Oxu"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                              Oxu
                            </button>
                            {canDownload && (
                              <button
                                className={styles.btnDl}
                                disabled={downloadingId === pdf.id}
                                onClick={() => handleDownload(pdf)}
                                title="Yüklə"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                {downloadingId === pdf.id ? "…" : "Yüklə"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button className="mmu-btn mmu-btn-outline mmu-btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Əvvəlki</button>
                <span className={styles.pageInfo}>{page} / {pagination.totalPages}</span>
                <button className="mmu-btn mmu-btn-outline mmu-btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Növbəti →</button>
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
