import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import bg from "./../../Assets/heroImage.jpg";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import Footer from "../../Layouts/Footer";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";

function NewsPage() {
  const [news, setNews] = useState(null);
  const store = useContext(dataContext);
  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState(null);
  const [filter, setFilter] = useState(false);
  const [language, setLanguage] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  function handleReset() {
    setSearch("");
    setCategoryId("");
    setStartDate("");
    setEndDate("");
  }
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      store.user.setData(null);
    } else {
      axios
        .get(Base_Url_Server + "users/" + userID, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          store.user.setData(response.data.data.user);
        })
        .catch((error) => {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        });
    }
  }, []);
  useEffect(() => {
    document.title = "Xəbərlər";
  }, []);
  useEffect(() => {
    setLoader(true);
    axios
      .get(
        Base_Url_Server +
          `news?page=${page}&search=${search}&categoryId=${categoryId}&startDate=${startDate}&endDate=${endDate}`
      )
      .then((res) => {
        setNews(res.data.data.news);
        setPageCount(res.data.data.pagination.total_pages);
        setLoader(false);
      })
      .catch(() => {
        setLoader(false);
      });
  }, [search, categoryId, endDate, startDate, page, language]);
  useEffect(() => {
    axios.get(Base_Url_Server + "categories").then((res) => {
      setCategories(res.data.data.categories);
    });
  }, []);
  return (
    <>
      <section className={styles.news}>
        <div className={styles.hero}>
          <div className={styles.bgImage}>
            <img src={bg} alt="accountant" />
            <h1>
              Vergi Məcəlləsi, qanun dəyişikləri və mühasibatlıq dünyasından ən
              son xəbərlər.
            </h1>
          </div>
        </div>
        <div className={styles.newsList}>
          <div className={styles.header}>
            <div></div>
            <NewspaperIcon className={styles.icon} />
            <div></div>
          </div>
          <div className={styles.filter}>
            <div
              className={styles.content}
              style={filter ? {} : { height: "60px" }}
            >
              <TuneIcon
                className={styles.iconFilter}
                onClick={() => {
                  setFilter(!filter);
                }}
              />
              <div className={styles.head}>
                <div>
                  <input
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                    type="text"
                    name=""
                    id=""
                    placeholder="Axtar"
                  />
                  <button type="submit">
                    <SearchIcon className={styles.icon} />
                  </button>
                </div>
              </div>
              <form className={styles.dropDown}>
                <div className={styles.date}>
                  <label htmlFor="startDate">Başlanğıc tarix:</label>
                  <input
                    onChange={(e) => {
                      setStartDate(e.target.value);
                    }}
                    type="date"
                    id="startDate"
                    placeholder="Bu tarixdən"
                  />
                  {/* <input type="date" id="endDate" placeholder="Bu tarixdən" /> */}
                </div>
                <div className={styles.date}>
                  <label htmlFor="startDate">Son tarix:</label>
                  <input
                    onChange={(e) => {
                      setEndDate(e.target.value);
                    }}
                    type="date"
                    id="startDate"
                    placeholder="Bu tarixdən"
                  />
s                </div>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                  }}
                >
                  <option value="">Kateqoriya</option>
                  {categories &&
                    categories.map((c, i) => {
                      return (
                        <option key={i} value={c.id}>
                          {c?.name}
                        </option>
                      );
                    })}
                </select>

                <button type="reset" onClick={handleReset}>
                  Filterləri təmizlə
                </button>
              </form>
            </div>
          </div>
          <div
            style={loader ? { display: "none" } : {}}
            className={styles.container}
          >
            {news ? (
              news &&
              news?.map((e, i) => {
                return (
                  <div
                    key={i}
                    className={styles.card}
                    onClick={() => {
                      navigate(`/news/${e.id}`);
                    }}
                  >
                    <div className={styles.cardContent}>
                      <div className={styles.cardImage}>
                        {e.image ? (
                          <img
                            src={
                              Base_Url_Server +
                              e.image?.split(
                                "/home/muhasibatjurnal/backend-mmu/"
                              )[1]
                            }
                            alt={e.title}
                          />
                        ) : (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%',
                            color: '#666',
                            fontSize: '14px',
                            textAlign: 'center',
                            padding: '20px'
                          }}>
                            Şəkil yoxdur
                          </div>
                        )}
                      </div>
                      <div className={styles.cardText}>
                        <span>{e.title}</span>
                        <p>
                          <span>{e.created_at?.split("T")[0]}</span>
                          <span>{e.category.name}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.loader}>
                <CircularProgress />
              </div>
            )}
          </div>
          <div
            style={loader ? {} : { display: "none" }}
            className={styles.loader}
          >
            <CircularProgress />
          </div>
          <div
            style={pageCount == 1 ? { display: "none" } : {}}
            className={styles.pagination}
          >
            <p
              onClick={() => {
                window.scrollTo(0, 0);

                if (1 < page) {
                  let newPage = page - 1;
                  setPage(newPage);
                } else setPage(pageCount);
              }}
              className={styles.paginationCountArrow}
            >
              {"<"}
            </p>
            <p
              onClick={() => {
                if (page != 1) {
                  setPage(1);
                  window.scrollTo(0, 0);
                }
              }}
              style={
                page == 1 ? { backgroundColor: "#032062", color: "white" } : {}
              }
              className={styles.paginationCount}
            >
              1
            </p>
            <p
              style={pageCount == 2 ? { display: "none" } : {}}
              className={styles.paginationCountDot}
            >
              ...
            </p>
            {page == 1 || page == pageCount ? (
              <p
                style={pageCount == 2 ? { display: "none" } : {}}
                className={styles.paginationCountDot}
              >
                ...
              </p>
            ) : (
              <p
                style={
                  pageCount == 2
                    ? { display: "none" }
                    : { backgroundColor: "#032062", color: "white" }
                }
                className={styles.paginationCount}
              >
                {page}
              </p>
            )}
            <p
              style={pageCount == 2 ? { display: "none" } : {}}
              className={styles.paginationCountDot}
            >
              ...
            </p>
            <p
              onClick={() => {
                if (page != pageCount) {
                  setPage(pageCount);
                  window.scrollTo(0, 0);
                }
              }}
              style={
                page == pageCount
                  ? { backgroundColor: "#032062", color: "white" }
                  : {}
              }
              className={styles.paginationCount}
            >
              {pageCount}
            </p>
            <p
              onClick={() => {
                window.scrollTo(0, 0);
                if (page < pageCount) {
                  let newPage = page + 1;
                  setPage(newPage);
                } else setPage(1);
              }}
              className={styles.paginationCountArrow}
            >
              {">"}
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default NewsPage;
