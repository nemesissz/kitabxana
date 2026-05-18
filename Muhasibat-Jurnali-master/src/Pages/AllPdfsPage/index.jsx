import { useContext, useEffect, useState, useCallback, useRef } from "react";
import styles from "./index.module.scss";
import Footer from "../../Layouts/Footer";
import bg from "./../../Assets/heroImage.jpg";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

function AllPdfsPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState([]);
  const [loader, setLoader] = useState(false);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const debounceRef = useRef(null);

  useEffect(() => {
    document.title = "Bütün PDF-lər | MMU Kitabxana";
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (token && userID) {
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

  const fetchPdfs = useCallback(async (currentPage, searchTerm) => {
    setLoader(true);
    const token = localStorage.getItem("token");
    try {
      let url;
      if (searchTerm && searchTerm.trim().length >= 2) {
        url = `${Base_Url_Server}pdfs/search?q=${encodeURIComponent(searchTerm.trim())}&page=${currentPage}&limit=24`;
      } else {
        url = `${Base_Url_Server}pdfs?page=${currentPage}&limit=24`;
      }
      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPdfs(res.data.data.pdfs || []);
      setPagination(res.data.data.pagination || null);
    } catch (err) {
      console.error("PDF yüklənmədi:", err);
    } finally {
      setLoader(false);
    }
  }, []);

  // İlk yükləmə
  useEffect(() => {
    fetchPdfs(page, search);
  }, [page]);

  // Real-time axtarış — 400ms debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPdfs(1, val);
    }, 400);
  };

  const handleClear = () => {
    setSearch("");
    setPage(1);
    fetchPdfs(1, "");
  };

  return (
    <>
      <section className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.bgImage}>
            <img src={bg} alt="pdfs" />
            <h1>Bütün PDF-lər</h1>
          </div>
        </div>

        <div className={styles.content}>
          {/* Real-time axtarış */}
          <div className={styles.searchBar}>
            <SearchIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Ad, təsvir və ya əmr № ilə axtar..."
              value={search}
              onChange={handleSearchChange}
              autoFocus
            />
            {search && (
              <button className={styles.clearBtn} onClick={handleClear}>✕</button>
            )}
            {loader && <CircularProgress size={20} className={styles.spinner} />}
          </div>

          {search.trim().length >= 2 && !loader && (
            <p className={styles.searchInfo}>
              <strong>"{search}"</strong> üzrə{" "}
              {pagination ? `${pagination.total} nəticə tapıldı` : "axtarılır..."}
            </p>
          )}

          {/* PDF siyahısı */}
          {!loader && pdfs.length === 0 ? (
            <div className={styles.empty}>
              {search ? "Axtarışa uyğun PDF tapılmadı." : "Hələ PDF yüklənməyib."}
            </div>
          ) : (
            <div className={styles.grid}>
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className={styles.card}
                  onClick={() => navigate(`/library/${pdf.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.cardImage}>
                    {pdf.image_path ? (
                      <img
                        src={formatServerFilePath(pdf.image_path)}
                        alt={pdf.title}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className={styles.noImage}>PDF</div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{pdf.title}</h3>
                    {pdf.order_number && (
                      <span className={styles.orderNumber}>Əmr №: {pdf.order_number}</span>
                    )}
                    {pdf.description && (
                      <p className={styles.cardDesc}>
                        {pdf.description.length > 80
                          ? pdf.description.slice(0, 80) + "..."
                          : pdf.description}
                      </p>
                    )}
                    <div className={styles.cardMeta}>
                      <span>{pdf.created_at?.split("T")[0].replaceAll("-", "/")}</span>
                      {Number(pdf.price) === 0 ? (
                        <span className={styles.free}>Pulsuz</span>
                      ) : (
                        <span className={styles.price}>{pdf.price} AZN</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className={styles.pageBtn}
              >
                ← Əvvəlki
              </button>
              <span className={styles.pageInfo}>
                {page} / {pagination.total_pages}
              </span>
              <button
                disabled={page === pagination.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className={styles.pageBtn}
              >
                Növbəti →
              </button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

export default AllPdfsPage;
