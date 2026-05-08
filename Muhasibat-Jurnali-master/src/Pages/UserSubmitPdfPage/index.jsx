import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Footer from "../../Layouts/Footer";

const LANGUAGES = [
  { value: "az", label: "Azərbaycan dili" },
  { value: "ru", label: "Rus dili" },
  { value: "en", label: "İngilis dili" },
];

function UserSubmitPdfPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order_number: "",
    author: "",
    language: "az",
    category_id: "",
    file: null,
    coverImage: null,
  });
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    document.title = "PDF Yüklə | Mühasibat Jurnalı";
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      navigate("/login");
      return;
    }
    axios
      .get(Base_Url_Server + "users/" + userID, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const userData = res.data.data.user;
        store.user.setData(userData);
        if (!userData.uploadPermission || userData.uploadPermission === "none") {
          Swal.fire({
            icon: "warning",
            title: "İcazə yoxdur",
            text: "PDF yükləmə icazəniz yoxdur. Adminlə əlaqə saxlayın.",
            confirmButtonColor: "#2c3e50",
          }).then(() => navigate("/library/all"));
        }
      })
      .catch(() => {
        store.user.setData(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      });
  }, []);

  useEffect(() => {
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => {});
  }, []);

  const handleCategoryChange = (e) => {
    const id = e.target.value;
    const cat = categories.find((c) => String(c.id) === id) || null;
    setSelectedCategory(cat);
    setFormData((prev) => ({ ...prev, category_id: id, order_number: "", author: "" }));
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateAndSetFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setFileError("Yalnız PDF faylı qəbul edilir");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setFileError("Maksimum fayl ölçüsü 20MB-dır");
      return;
    }
    setFileError("");
    setFormData((prev) => ({ ...prev, file: f }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    if (!formData.title.trim()) return Swal.fire("Xəta", "PDF adı tələb olunur", "error");
    if (!formData.file) return Swal.fire("Xəta", "PDF faylı seçin", "error");

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("language", formData.language);
    if (formData.category_id) data.append("category_id", formData.category_id);
    if (formData.description.trim()) data.append("description", formData.description.trim());

    // Şərti sahələr
    if (selectedCategory?.pdf_type === "kitab") {
      if (formData.author.trim()) data.append("author", formData.author.trim());
    } else {
      if (formData.order_number.trim()) data.append("order_number", formData.order_number.trim());
    }

    data.append("file", formData.file);
    if (formData.coverImage) data.append("coverImage", formData.coverImage);

    try {
      setLoader(true);
      const res = await axios.post(Base_Url_Server + "pdfs/submit", data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      const isPending = res.data?.data?.pdf?.status === "pending" ||
        store.user.data?.uploadPermission === "pending";

      await Swal.fire({
        icon: "success",
        title: "Uğurlu!",
        text: isPending
          ? "PDF uğurla yükləndi. Admin təsdiqlədikdən sonra kitabxanada görünəcək."
          : "PDF uğurla yükləndi və kitabxanaya əlavə edildi.",
        confirmButtonColor: "#2c3e50",
      });
      navigate("/library/all");
    } catch (err) {
      Swal.fire("Xəta", err.response?.data?.message || "Xəta baş verdi", "error");
    } finally {
      setLoader(false);
    }
  };

  const pdfType = selectedCategory?.pdf_type || null;

  return (
    <>
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.header}>
              <UploadFileIcon className={styles.headerIcon} />
              <h1>PDF Yüklə</h1>
              <p>PDF sənədinizi kitabxanaya əlavə edin</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>

              {/* PDF adı */}
              <div className={styles.formGroup}>
                <label htmlFor="title">PDF Adı <span className={styles.required}>*</span></label>
                <input
                  id="title" name="title" type="text"
                  placeholder="PDF-in adını daxil edin"
                  value={formData.title} onChange={handleChange} required
                />
              </div>

              {/* Kateqoriya */}
              <div className={styles.formGroup}>
                <label htmlFor="category_id">Kateqoriya</label>
                <select
                  id="category_id" name="category_id"
                  value={formData.category_id} onChange={handleCategoryChange}
                  className={styles.select}
                >
                  <option value="">— Kateqoriya seçin (istəyə bağlı) —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {selectedCategory && (
                  <span className={styles.categoryHint}>
                    {pdfType === "kitab" ? "📚 Kitab kateqoriyası — müəllif sahəsi aktiv"
                      : pdfType === "serecam" ? "📋 Şərəcam kateqoriyası — əmr № sahəsi aktiv"
                      : "📄 Əmr kateqoriyası — əmr № sahəsi aktiv"}
                  </span>
                )}
              </div>

              {/* Dil */}
              <div className={styles.formGroup}>
                <label htmlFor="language">Dil <span className={styles.required}>*</span></label>
                <select
                  id="language" name="language"
                  value={formData.language} onChange={handleChange}
                  className={styles.select}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Şərti sahə: Müəllif (kitab) və ya Əmr № (emr/serecam/seçilməmiş) */}
              {pdfType === "kitab" ? (
                <div className={styles.formGroup}>
                  <label htmlFor="author">Müəllif</label>
                  <input
                    id="author" name="author" type="text"
                    placeholder="Müəllifin adı"
                    value={formData.author} onChange={handleChange}
                  />
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label htmlFor="order_number">
                    {pdfType === "serecam" ? "Şərəcam №" : "Əmr №"}
                  </label>
                  <input
                    id="order_number" name="order_number" type="text"
                    placeholder={pdfType === "serecam" ? "Məs: 15-Ş/2025" : "Məs: 123/2025 və ya 45-Q"}
                    value={formData.order_number} onChange={handleChange}
                  />
                </div>
              )}

              {/* Təsvir */}
              <div className={styles.formGroup}>
                <label htmlFor="description">Təsvir</label>
                <textarea
                  id="description" name="description"
                  placeholder="PDF haqqında qısa məlumat"
                  value={formData.description} onChange={handleChange} rows={4}
                />
              </div>

              {/* PDF faylı */}
              <div className={styles.formGroup}>
                <label>PDF Faylı <span className={styles.required}>*</span></label>
                <div
                  className={`${styles.dropZone} ${dragOver ? styles.dragActive : ""} ${formData.file ? styles.hasFile : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("pdfFileInput").click()}
                >
                  <input
                    id="pdfFileInput" type="file" accept="application/pdf"
                    onChange={(e) => validateAndSetFile(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                  {formData.file ? (
                    <div className={styles.fileSelected}>
                      <UploadFileIcon />
                      <span>{formData.file.name}</span>
                      <small>{(formData.file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                  ) : (
                    <div className={styles.dropZoneContent}>
                      <UploadFileIcon className={styles.dropIcon} />
                      <p>PDF faylını sürükləyin və ya <strong>seçin</strong></p>
                      <small>Maksimum 20MB</small>
                    </div>
                  )}
                </div>
                {fileError && <span className={styles.error}>{fileError}</span>}
              </div>

              {/* Üz qabığı */}
              <div className={styles.formGroup}>
                <label htmlFor="coverImage">Üz qabığı şəkli (istəyə bağlı)</label>
                <input
                  id="coverImage" type="file" accept="image/*"
                  onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.files[0] || null }))}
                  className={styles.fileInput}
                />
                {formData.coverImage && (
                  <small className={styles.fileName}>{formData.coverImage.name}</small>
                )}
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loader}>
                {loader ? (
                  <>
                    <CircularProgress size={18} style={{ color: "#fff", marginRight: 8 }} />
                    Yüklənir...
                  </>
                ) : (
                  "PDF-i Yüklə"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default UserSubmitPdfPage;
