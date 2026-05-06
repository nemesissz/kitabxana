import { useContext, useEffect, useState, useMemo, useRef } from "react";
import styles from "../LibraryPage/index.module.scss";
import Footer from "../../Layouts/Footer";
import bg from "./../../Assets/heroImage.jpg";
import BookIcon from "@mui/icons-material/Book";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CircularProgress from "@mui/material/CircularProgress";
import { initiateCheckout } from "../../Services/paymentService";
import { useNavigate, useParams } from "react-router-dom";

// Ay adları
const monthNames = [
  "Yanvar", "Fevral", "Mart", "Aprel",
  "May", "İyun", "İyul", "Avqust",
  "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
];

// Tüm aylar (0-11)
const allMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function CategoryLibraryPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [loader, setLoader] = useState(false);
  const [allPdfs, setAllPdfs] = useState([]);
  const [category, setCategory] = useState(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [filter, setFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [language, setLanguage] = useState("");

  // Yıl seçimi (sadece tax-journal için)
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  function handleReset() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setMin("");
    setMax("");
    setLanguage("");
  }

  // Tek PDF satın alma
  const handleBuyPdf = async (pdf) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const finalPrice = pdf?.priceInfo?.hasDiscount 
        ? pdf.priceInfo.discountedPrice 
        : pdf?.price || 0;
      
      const data = {
        type: "single-pdf",
        pdfId: pdf.id,
        amount: finalPrice,
      };

      const response = await initiateCheckout(data, token);

      if (response?.data?.payment?.paymentUrl) {
        window.location.href = response.data.payment.paymentUrl;
      } else {
        throw new Error("Ödəniş URL-i alınmadı");
      }
    } catch (error) {
      console.error("Ödəniş xətası:", error);
      alert("Ödəniş zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.");
    }
  };

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

  // Kategori bilgilerini yükle
  useEffect(() => {
    if (categoryId) {
      axios
        .get(Base_Url_Server + "categories/pdfs/" + categoryId)
        .then((res) => {
          setCategory(res.data.data.category);
          document.title = res.data.data.category?.name || "Kitabxana";
        })
        .catch((err) => {
          console.error("Kateqoriya yüklənmədi:", err);
          navigate("/");
        });
    }
  }, [categoryId, navigate]);

  // PDF'leri yıl ve aya göre grupla (tax-journal için)
  const pdfsByYearAndMonth = useMemo(() => {
    if (!category || category.display_type !== 'tax-journal') return {};
    
    const grouped = {};
    if (!allPdfs || allPdfs.length === 0) return grouped;

    allPdfs.forEach((pdf) => {
      const dateString = pdf.pdfDate || pdf.created_at;
      if (!dateString) return;
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return;
      
      const year = date.getFullYear();
      const month = date.getMonth();

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }
      grouped[year][month].push(pdf);
    });

    Object.keys(grouped).forEach((year) => {
      Object.keys(grouped[year]).forEach((month) => {
        grouped[year][month].sort((a, b) => {
          const dateA = new Date(a.pdfDate || a.created_at);
          const dateB = new Date(b.pdfDate || b.created_at);
          return dateA - dateB;
        });
      });
    });

    return grouped;
  }, [allPdfs, category]);

  // Seçilen yıla göre PDF'leri filtrele (tax-journal için)
  const filteredPdfs = useMemo(() => {
    if (!category || category.display_type !== 'tax-journal') return {};
    if (!selectedYear || !pdfsByYearAndMonth[selectedYear]) return {};
    return pdfsByYearAndMonth[selectedYear];
  }, [pdfsByYearAndMonth, selectedYear, category]);

  // Tarihe göre sıralı PDF'ler (other-books için)
  const sortedPdfsByDate = useMemo(() => {
    if (!category || category.display_type !== 'other-books') return [];
    if (!allPdfs || allPdfs.length === 0) return [];
    
    return [...allPdfs].sort((a, b) => {
      const dateA = new Date(a.pdfDate || a.created_at);
      const dateB = new Date(b.pdfDate || b.created_at);
      return dateB - dateA; // En yeni önce
    });
  }, [allPdfs, category]);

  // PDF'leri yükle
  useEffect(() => {
    if (!categoryId) return;
    
    setLoader(true);
    const token = localStorage.getItem("token");

    const fetchAllPdfs = async () => {
      try {
        let allPdfs = [];
        let currentPage = 1;
        let hasMore = true;
        const pageSize = 100;

        while (hasMore) {
          const response = await axios.get(
            Base_Url_Server +
              `pdfs?page=${currentPage}&limit=${pageSize}&search=${search}&language=${language}&categoryId=${categoryId}&minPrice=${min}&maxPrice=${max}&startDate=${startDate}&endDate=${endDate}`,
            token
              ? {
                  headers: { Authorization: `Bearer ${token}` },
                }
              : {}
          );

          const pdfs = response.data.data.pdfs || [];
          const pagination = response.data.data.pagination || {};
          
          allPdfs = [...allPdfs, ...pdfs];
          
          if (pagination.current_page >= pagination.total_pages || pdfs.length === 0) {
            hasMore = false;
          } else {
            currentPage++;
          }
        }

        setLoader(false);
        setAllPdfs(allPdfs);
      } catch (error) {
        setLoader(false);
        console.error("PDF yükləmə xətası:", error);
      }
    };

    fetchAllPdfs();
  }, [search, categoryId, min, max, endDate, startDate, language]);

  // Tax-journal için yılları bul (kategori ve PDF'ler yüklendikten sonra)
  useEffect(() => {
    if (category && category.display_type === 'tax-journal' && allPdfs.length > 0) {
      const years = new Set();
      allPdfs.forEach((pdf) => {
        const dateString = pdf.pdfDate || pdf.created_at;
        if (dateString) {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            years.add(date.getFullYear());
          }
        }
      });
      const sortedYears = Array.from(years).sort((a, b) => a - b);
      setAvailableYears(sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()]);
    }
  }, [category, allPdfs]);

  // Yıllar güncellendiğinde veya selectedYear mevcut değilse, en eski yılı seç
  useEffect(() => {
    if (category && category.display_type === 'tax-journal' && availableYears.length > 0) {
      if (selectedYear === null || !availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0]);
      }
    }
  }, [availableYears, selectedYear, category]);

  // Ay için PDF'leri al (maksimum 2 PDF)
  const getPdfsForMonth = (monthIndex) => {
    if (!filteredPdfs[monthIndex]) return [];
    return filteredPdfs[monthIndex].slice(0, 2);
  };

  // Yıl değiştirme fonksiyonları
  const handlePreviousYear = () => {
    const sortedYears = [...availableYears].sort((a, b) => a - b);
    const currentIndex = sortedYears.indexOf(selectedYear || sortedYears[0]);
    if (currentIndex > 0) {
      setSelectedYear(sortedYears[currentIndex - 1]);
    }
  };

  const handleNextYear = () => {
    const sortedYears = [...availableYears].sort((a, b) => a - b);
    const currentIndex = sortedYears.indexOf(selectedYear || sortedYears[0]);
    if (currentIndex < sortedYears.length - 1) {
      setSelectedYear(sortedYears[currentIndex + 1]);
    }
  };

  const handleYearClick = (year) => {
    setSelectedYear(year);
  };

  const yearScrollContainerRef = useRef(null);

  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  const handleScrollLeft = () => {
    if (isMobile() && yearScrollContainerRef.current) {
      yearScrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    } else {
      handlePreviousYear();
    }
  };

  const handleScrollRight = () => {
    if (isMobile() && yearScrollContainerRef.current) {
      yearScrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    } else {
      handleNextYear();
    }
  };

  // PDF kartı render fonksiyonu
  const renderPdfCard = (pdf) => (
    <div
      key={pdf.id}
      className={styles.card}
      onClick={() => navigate(`/library/${pdf.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.cardContent}>
        <div className={styles.cardImage}>
          {pdf.image_path ? (
            <img className="imageE"
              src={
                formatServerFilePath(pdf.image_path) ||
                "/src/Assets/heroImage.jpg"
              }
              alt={pdf.title}
              loading="lazy"
              onError={(ev) => {
                ev.target.src = "/src/Assets/heroImage.jpg";
              }}
              onLoad={(ev) => {
                ev.target.style.opacity = "1";
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
          <div className={styles.imageOverlay}></div>
        </div>
        <div className={styles.cardHeader}>
          <h2>
            <span>{pdf.title}</span>
          </h2>
          <h5>
            {pdf.description?.length <= 100
              ? pdf.description
              : pdf.description?.slice(0, 100) + "..."}
          </h5>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardInfo}>
            <span>
              {pdf.created_at
                ?.split("T")[0]
                .replaceAll("-", "/")}
            </span>
            <span>{pdf.category?.name || pdf.category_name}</span>
          </div>
          <div className={styles.cardButtons}>
            {pdf.hasAccess ? (
              <span
                onClick={(event) => {
                  event.stopPropagation();
                }}
                className={styles.accessible}
              >
                <span>
                  {pdf.accessType === "subscription"
                    ? "Abunəliklə Əlçatandır"
                    : "Alınıb - Əlçatandır"}
                </span>
              </span>
            ) : (
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  handleBuyPdf(pdf);
                }}
              >
                <span>PDF-i əldə et</span>
                {pdf.priceInfo?.hasDiscount ? (
                  <div className={styles.discountPricing}>
                    <b className={styles.originalPrice}>
                      {pdf.priceInfo.originalPrice} AZN
                    </b>
                    <b className={styles.discountedPrice}>
                      {pdf.priceInfo.discountedPrice.toFixed(2)} AZN
                    </b>
                    <span className={styles.discountPercent}>
                      {pdf.priceInfo.discountPercent}% endirim
                    </span>
                  </div>
                ) : (
                  <b>{pdf.price} AZN</b>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!category) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <>
      <section className={styles.library}>
        <div className={styles.hero}>
          <div className={styles.bgImage}>
            <img src={bg} alt="accountant" />
            <h1>{category.name}</h1>
          </div>
        </div>
        <div className={styles.bookList}>
          <div className={styles.header}>
            <div></div>
            <BookIcon className={styles.icon} />
            <div></div>
          </div>

          {/* Tax-journal için yıl scroll */}
          {category.display_type === 'tax-journal' && availableYears.length > 0 && (
            <div className={styles.yearScroll}>
              <button 
                className={styles.yearArrow}
                onClick={handleScrollLeft}
                disabled={(() => {
                  const sortedYears = [...availableYears].sort((a, b) => a - b);
                  const currentIndex = sortedYears.indexOf(selectedYear || sortedYears[0]);
                  return currentIndex === 0;
                })()}
              >
                <ArrowBackIosIcon />
              </button>
              <div className={styles.yearScrollContainer} ref={yearScrollContainerRef}>
                {(() => {
                  const sortedYears = [...availableYears].sort((a, b) => a - b);
                  const selectedYearValue = selectedYear || sortedYears[0];
                  const beforeYears = sortedYears.filter(y => y < selectedYearValue);
                  const afterYears = sortedYears.filter(y => y > selectedYearValue);
                  const centeredYears = [...beforeYears, selectedYearValue, ...afterYears];
                  
                  return centeredYears.map((year, index) => {
                    const totalYears = centeredYears.length;
                    const centerIndex = Math.floor(totalYears / 2);
                    const distanceFromCenter = index - centerIndex;
                    const maxDistance = Math.max(centerIndex, totalYears - centerIndex - 1) || 1;
                    const rotationY = maxDistance > 0 ? (distanceFromCenter / maxDistance) * 25 : 0;
                    const translateZ = Math.abs(distanceFromCenter) * -15;
                    const zIndexValue = totalYears - Math.abs(distanceFromCenter);
                    
                    return (
                      <div
                        key={year}
                        className={`${styles.yearButton} ${
                          selectedYear === year ? styles.active : ""
                        }`}
                        style={{
                          '--rotation-y': `${rotationY}deg`,
                          '--translate-z': `${translateZ}px`,
                          '--z-index': zIndexValue,
                        }}
                        onClick={() => handleYearClick(year)}
                      >
                        {year}
                      </div>
                    );
                  });
                })()}
              </div>
              <button 
                className={styles.yearArrow}
                onClick={handleScrollRight}
                disabled={(() => {
                  const sortedYears = [...availableYears].sort((a, b) => a - b);
                  const currentIndex = sortedYears.indexOf(selectedYear || sortedYears[0]);
                  return currentIndex === sortedYears.length - 1;
                })()}
              >
                <ArrowForwardIosIcon />
              </button>
            </div>
          )}

          {/* Filtreler */}
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
                    value={search}
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
                </div>
                <div className={styles.date}>
                  <label htmlFor="endDate">Son tarix:</label>
                  <input
                    onChange={(e) => {
                      setEndDate(e.target.value);
                    }}
                    type="date"
                    id="endDate"
                    placeholder="Bu tarixdən"
                  />
                </div>
                <select
                  onChange={(e) => {
                    setLanguage(e.target.value);
                  }}
                >
                  <option value="">Dil seçimi</option>
                  <option value="az">Azərbaycan</option>
                  <option value="ru">Rusca</option>
                </select>
                <input
                  type="number"
                  placeholder="Minimum qiymət"
                  onChange={(e) => {
                    setMin(e.target.value);
                  }}
                />
                <input
                  type="number"
                  placeholder="Maksimum qiymət"
                  onChange={(e) => {
                    setMax(e.target.value);
                  }}
                />
                <button type="reset" onClick={handleReset}>
                  Filterləri təmizlə
                </button>
              </form>
            </div>
          </div>

          {/* Tax-journal görünümü: Aylara göre */}
          {category.display_type === 'tax-journal' && selectedYear ? (
            <div className={styles.monthGroupsContainer}>
              {allMonths.map((monthIndex) => {
                const monthPdfs = getPdfsForMonth(monthIndex);
                const pdf1 = monthPdfs[0] || null;
                const pdf2 = monthPdfs[1] || null;
                return (
                  <div key={monthIndex} className={styles.monthSection}>
                    <div className={styles.monthParent}>
                      <div className={styles.monthLabel}>
                        {monthNames[monthIndex]}
                      </div>
                      <div className={styles.connectionLine}></div>
                      <div className={styles.monthChildren}>
                        {pdf1 && (
                          <div className={styles.pdfNodeTop}>
                            {renderPdfCard(pdf1)}
                          </div>
                        )}
                        {pdf2 && (
                          <div className={styles.pdfNodeBottom}>
                            {renderPdfCard(pdf2)}
                          </div>
                        )}
                        {!pdf1 && !pdf2 && (
                          <div className={styles.noPdf}>
                            Bu ay üçün PDF yoxdur
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : category.display_type === 'tax-journal' ? (
            <div className={styles.noYearSelected}>
              <p>Zəhmət olmasa il seçin</p>
            </div>
          ) : (
            /* Other-books görünümü: Tarihe göre sıralı liste */
            <div className={styles.container}>
              {sortedPdfsByDate.length > 0 ? (
                sortedPdfsByDate.map((pdf) => renderPdfCard(pdf))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Bu kateqoriyada PDF tapılmadı</p>
                </div>
              )}
            </div>
          )}

          <div
            style={loader ? {} : { display: "none" }}
            className={styles.loader}
          >
            <CircularProgress />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default CategoryLibraryPage;

