import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import Footer from "../../Layouts/Footer";
import bg from "./../../Assets/heroImage.jpg";
import DescriptionIcon from "@mui/icons-material/Description";
import dataContext from "../../Contexts/GlobalState";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import DownloadIcon from "@mui/icons-material/Download";
import CategoryIcon from "@mui/icons-material/Category";
import { useNavigate } from "react-router-dom";

// CV faylları public folder-dən göstərilir
const cvTemplates = [
  {
    id: 1,
    title: "CV Şablon 1",
    description: "Klassik CV nümunəsi - .doc formatında",
    category: "Klassik",
    downloadUrl: "/cv/cv1111.doc",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524135924_cv1111.jpg"
  },
  {
    id: 2,
    title: "CV Şablon 2",
    description: "Modern CV formatı - .docx",
    category: "Modern",
    downloadUrl: "/cv/cv2222.docx",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136007_cv2222.jpg"
  },
  {
    id: 3,
    title: "CV Şablon 3",
    description: "Elektrik mühəndisi üçün CV - .docx",
    category: "Mühəndis",
    downloadUrl: "/cv/cv3333.docx",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524135960_cv3333.jpg"
  },
  {
    id: 4,
    title: "CV Şablon 4",
    description: "Satış meneceri CV - .doc formatında",
    category: "Satış",
    downloadUrl: "/cv/cv4444.doc",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524135943_cv4444.jpg"
  },
  {
    id: 5,
    title: "CV Şablon 5",
    description: "Modern CV formatı - .doc",
    category: "Modern",
    downloadUrl: "/cv/cv5555.doc",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524135948_cv5555.jpg"
  },
  {
    id: 6,
    title: "CV Şablon 6",
    description: "İT spesialisti üçün CV formatı",
    category: "IT",
    downloadUrl: "/cv/cv6666.doc",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136007_cv6666.jpg"
  },
  {
    id: 7,
    title: "CV Şablon 7",
    description: "Mühasibat üçün CV - .docx",
    category: "Maliyyə",
    downloadUrl: "/cv/cv7777.docx",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136186_cv7777.jpg"
  },
  {
    id: 8,
    title: "Yeni CV 1",
    description: "2022-ci il üçün yeni CV formatı - .doc",
    category: "Yeni",
    downloadUrl: "/cv/yenicv1.doc",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136186_yenicv1.jpg"
  },
  {
    id: 9,
    title: "Yeni CV 2",
    description: "Modern yeni CV - .docx",
    category: "Yeni",
    downloadUrl: "/cv/yenicv2.docx",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136193_yenicv2.jpg"
  },
  {
    id: 10,
    title: "Yeni CV 3",
    description: "Kreativ CV formatı - .doc",
    category: "Yeni",
    downloadUrl: "/cv/yenicv3.doc",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136195_yenicv3.jpg"
  },
  {
    id: 11,
    title: "Yeni CV 4",
    description: "Minimalist CV dizaynı - .docx",
    category: "Minimalist",
    downloadUrl: "/cv/yenicv4.docx",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136215_yenicv4.jpg"
  },
  {
    id: 12,
    title: "Yeni CV 5",
    description: "Proqramçı üçün xüsusi CV - .doc",
    category: "IT",
    downloadUrl: "/cv/yenicv5-1.doc",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136215_yenicv5.jpg"
  },
  {
    id: 13,
    title: "Yeni CV 6",
    description: "Marketing üçün CV - .doc",
    category: "Satış",
    downloadUrl: "/cv/yenicv6.doc",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136217_yenicv6.jpg"
  },
  {
    id: 14,
    title: "Yeni CV 7",
    description: "HR spesialisti üçün CV - .docx",
    category: "HR",
    downloadUrl: "/cv/yenicv7.docx",
    imageUrl: "https://hr-az.com/uploads/posts/2018-04/1524136144_yenicv7.jpg"
  }
];

function CVsPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [cvs] = useState(cvTemplates);
  const [categories] = useState(["Bütünü", "Klassik", "Modern", "Yeni", "Mühəndis", "IT", "Maliyyə", "Satış", "HR", "PowerPoint", "Kreativ", "Minimalist"]);

  const [filter, setFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Bütünü");

  function handleReset() {
    setSearch("");
    setCategory("Bütünü");
  }

  // Filtrə edilmiş CV-ləri qaytar
  const filteredCvs = cvs.filter(cv => {
    const matchesSearch = !search || cv.title.toLowerCase().includes(search.toLowerCase()) || 
                         (cv.description && cv.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !category || category === "Bütünü" || cv.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (cv) => {
    if (cv.downloadUrl) {
      // URL-ə domain əlavə etməyə ehtiyac yoxdur, çünki Vite public folder-dən serve edir
      window.location.href = cv.downloadUrl;
    }
  };

  return (
    <>
      <div style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover" }} className={styles.header}>
        <div className={styles.overlay}>
          <h1>CV Numunələri</h1>
          <p>Pulsuz CV şablonları yükləyin və öz CV-nizi hazırlayın</p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <SearchIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder="CV axtar..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button className={styles.filterBtn} onClick={() => setFilter(!filter)}>
            <TuneIcon /> Filtr
          </button>
        </div>

        {filter && (
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label>Kateqoriya:</label>
              <select value={category} onChange={(e) => {
                setCategory(e.target.value);
              }}>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button className={styles.resetBtn} onClick={handleReset}>
              Reset
            </button>
          </div>
        )}

        {filteredCvs.length === 0 ? (
          <div className={styles.noResults}>
            <DescriptionIcon />
            <h3>CV tapılmadı</h3>
            <p>Axtarış şərtlərinizi dəyişdirin</p>
          </div>
        ) : (
          <div className={styles.cvsGrid}>
            {filteredCvs.map((cv) => (
              <div key={cv.id} className={styles.cvCard}>
                {cv.imageUrl ? (
                  <div className={styles.cvImage}>
                    <img src={cv.imageUrl} alt={cv.title} />
                  </div>
                ) : (
                  <div className={styles.cvIcon}>
                    <DescriptionIcon />
                  </div>
                )}
                <h3>{cv.title}</h3>
                {cv.description && <p className={styles.description}>{cv.description}</p>}
                {cv.category && (
                  <div className={styles.category}>
                    <CategoryIcon /> {cv.category}
                  </div>
                )}
                <button
                  className={styles.downloadBtn}
                  onClick={() => handleDownload(cv)}
                >
                  <DownloadIcon /> Pulsuz Yüklə
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default CVsPage;

