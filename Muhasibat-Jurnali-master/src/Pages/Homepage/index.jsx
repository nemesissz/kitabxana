import { useNavigate } from "react-router-dom";
import bgImage from "./../../Assets/heroImage.jpg";
import styles from "./index.module.scss";
import { useContext, useEffect, useState } from "react";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import Footer from "../../Layouts/Footer";
import CircularProgress from "@mui/material/CircularProgress";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AdSpace from "../../Components/AdSpace";

function HomePage() {
  const navigator = useNavigate();
  const store = useContext(dataContext);
  const [news, setNews] = useState(null);
  const [library, setLibrary] = useState(null);
  const [services, setServices] = useState(null);

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
          console.log(response.data.data.user);
        })
        .catch((error) => {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        });
    }
  }, []);
  useEffect(() => {
    document.title = "Mühasibat Jurnalı";
    // window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    axios.get(Base_Url_Server + "news/preview?limit=4").then((res) => {
      setNews(res.data.data.news);
    });
  }, []);
  useEffect(() => {
    // Erişim rozetleri üçün preview əvəzinə tam siyahı API (limitli) istifadə edək
    const token = localStorage.getItem("token");
    axios
      .get(Base_Url_Server + "pdfs?limit=3", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        setLibrary(res.data.data.pdfs);
      });
  }, []);
  useEffect(() => {
    axios.get(Base_Url_Server + "services/preview?limit=3").then((res) => {
      setServices(res.data.data.services);
    });
  }, []);

  return (
    <>
      <main>
        <section className={styles.hero}>
          <div className={styles.bgImage}>
            <img src={bgImage} alt="accountant" />
            <div className={styles.glass}>
              <div
                className={styles.arrow}
                onClick={() => {
                  window.scrollTo(0, 500);
                }}
              >
                <span>Kəşf et!</span>
                <ArrowForwardIosIcon className={styles.icon} />
              </div>
              <div className={styles.container}>
                <div className={styles.heroContent}>
                  <div className={styles.leftContent}>
                    <h1>
                      Vergi və hesabat işləri artıq çətin deyil. Dəqiq və etibarlı
                      xidmətlə yanınızdayıq.
                    </h1>
                    <div className={styles.btns}>
                      <ul>
                        <li
                          onClick={() => {
                            navigator("/subscriptions");
                          }}
                        >
                          Abunəlikləri Kəşf Et
                        </li>
                        <li
                          onClick={() => {
                            navigator("/");
                          }}
                        >
                          PDF-lər
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className={styles.rightContent}>
                    <div className={styles.studentDiscount}>
                      <div className={styles.discountIcon}>🎓</div>
                      <div className={styles.discountContent}>
                        <h3>Tələbələr üçün xüsusi təklif!</h3>
                        <p>.edu və .edu.az email ilə qeydiyyatdan keçən tələbələrə <strong>50% endirim</strong></p>
                      </div>
                      <div className={styles.discountBadge}>50%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <AdSpace position="home-hero-bottom" />
        <section className={`${styles.news} ${styles.section}`}>
          <div className={styles.header}>
            <div className={styles.hr}></div>
            <h2>Son xəbərlər</h2>
            <div className={styles.hr}></div>
          </div>
          <div className={styles.container}>
            {news ? (
              news &&
              news?.map((e) => {
                return (
                  <div
                    key={e.id}
                    className={styles.card}
                    onClick={() => navigator(`/news/${e.id}`)}
                    role="button"
                    tabIndex={0}
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
                        <p className={styles.title}>{e.title}</p>
                        <p>
                          <span>{e.created_at?.split("T")[0]}</span>
                          <span>{e.category_name}</span>
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
          <div className={styles.footer}>
            <span
              className={styles.text}
              onClick={() => {
                navigator("/news");
              }}
            >
              Daha çox
            </span>
          </div>
        </section>
        <AdSpace position="home-news-bottom" />
        <section className={`${styles.library} ${styles.section}`}>
          <div className={styles.header}>
            <div className={styles.hr}></div>
            <h2>Son PDF-lər</h2>
            <div className={styles.hr}></div>
          </div>
          <div className={styles.container}>
            {library ? (
              library &&
              library?.map((e) => {
                return (
                  <div key={e.id} className={styles.card} onClick={() => navigator(`/library/${e.id}`)} role="button" tabIndex={0}>
                    <div className={styles.cardContent}>
                      <div className={styles.cardImage}>
                        {e.image_path ? (
                          <img
                            src={formatServerFilePath(e.image_path) || '/src/Assets/heroImage.jpg'}
                            alt={e.title}
                            onError={(ev) => {
                              ev.target.src = '/src/Assets/heroImage.jpg';
                            }}
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
                      <div className={styles.cardHeader}>
                        <h2>
                          <span>{e.title}</span>{" "}
                          {/* <span>{e.language.toLocaleUpperCase()}</span> */}
                        </h2>
                        <h5>
                          {e.description?.length <= 200
                            ? e.description
                            : e.description?.slice(0, 200) + "..."}
                        </h5>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.cardInfo}>
                          <span>
                            {e.created_at?.split("T")[0].replaceAll("-", "/")}
                          </span>
                          <span>{e.category?.name}</span>
                        </div>
                        <div className={styles.cardButtons}>
                          {e.hasAccess ? (
                            <span
                              onClick={(event) => {
                                event.stopPropagation(); // Kartın onClick'ini durdur
                              }}
                              className={styles.accessible}
                            >
                              <span>
                                {e.accessType === "subscription"
                                  ? "Abunəliklə Əlçatandır"
                                  : "Alınıb - Əlçatandır"}
                              </span>
                            </span>
                          ) : (
                            <span
                              onClick={(event) => {
                                event.stopPropagation(); // Kartın onClick'ini durdur
                              }}
                            >
                              <span>PDF-i əldə et</span>
                              {e.priceInfo?.hasDiscount ? (
                                <div className={styles.discountPricing}>
                                  <b className={styles.originalPrice}>
                                    {e.priceInfo.originalPrice} AZN
                                  </b>
                                  <b className={styles.discountedPrice}>
                                    {e.priceInfo.discountedPrice.toFixed(2)} AZN
                                  </b>
                                  <span className={styles.discountPercent}>
                                    {e.priceInfo.discountPercent}% endirim
                                  </span>
                                </div>
                              ) : (
                                <b>{e.price} AZN</b>
                              )}
                            </span>
                          )}
                        </div>
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
          <div className={styles.footer}>
            <span
              onClick={() => {
                navigator("/");
              }}
              className={styles.text}
            >
              Daha çox
            </span>
          </div>
        </section>
        <AdSpace position="home-library-bottom" />
        <section className={`${styles.services} ${styles.section}`}>
          <div className={styles.header}>
            <div className={styles.hr}></div>
            <h2>Son servislər</h2>
            <div className={styles.hr}></div>
          </div>
          <div className={styles.container}>
            {services ? (
              services &&
              services?.map((e) => {
                return (
                  <div
                    key={e.id}
                    className={styles.card}
                    onClick={() => navigator(`/services/${e.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        navigator(`/services/${e.id}`);
                      }
                    }}
                  >
                    <div className={styles.cardContent}>
                      <div className={styles.icons}>
                        <div className={styles.hr}></div>
                        <BookmarksIcon />
                        <div className={styles.hr}></div>
                      </div>
                      <div className={styles.title}>{e.name}</div>
                      <div className={styles.price}>{e.price} AZN</div>
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
          <div className={styles.footer}>
            <span
              onClick={() => {
                navigator("/services");
              }}
              className={styles.text}
            >
              Daha çox
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default HomePage;
