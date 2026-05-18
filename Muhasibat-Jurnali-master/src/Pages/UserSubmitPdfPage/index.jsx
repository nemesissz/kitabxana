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
import { useLanguages } from "../../Hooks/useLanguages";

function UserSubmitPdfPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    table_of_contents: "",
    order_number: "",
    author: "",
    isbn: "",
    publication_year: "",
    publisher_location: "",
    foreword: "",
    price: "",
    allow_download: "1",
    language: "az",
    category_id: "",
    institution_id: "",
    file: null,
    coverImage: null,
  });
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadLimitMb, setUploadLimitMb] = useState(20);
  const [institutions, setInstitutions] = useState([]);
  const { languages } = useLanguages();

  useEffect(() => {
    document.title = "PDF Yüklə | MMU Kitabxana";
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
          return;
        }
        axios
          .get(Base_Url_Server + "settings/upload-limits/me", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((r) => setUploadLimitMb(r.data.data.limit_mb))
          .catch(() => {});
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      });
  }, []);

  useEffect(() => {
    axios
      .get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isBookFiziki || isBookHerIkisi) {
      axios.get(Base_Url_Server + "institutions/public")
        .then((res) => setInstitutions(res.data.data?.institutions || res.data.data || []))
        .catch(() => {});
    }
  }, [isBookFiziki, isBookHerIkisi]);

  const selectedCatName = categories.find((c) => String(c.id) === String(formData.category_id))?.name || "";
  const catNameLower = selectedCatName.toLowerCase();
  const isBookElektron = catNameLower.includes("kitab-elektron");
  const isBookFiziki   = catNameLower.includes("kitab-fiziki");
  const isBookHerIkisi = catNameLower.includes("kitab-hər ikisi") || catNameLower.includes("kitab-her ikisi");
  const isBookCategory = isBookElektron || isBookFiziki || isBookHerIkisi;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCategoryChange = (e) => {
    setFormData((prev) => ({ ...prev, category_id: e.target.value }));
  };

  const validateAndSetFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setFileError("Yalnız PDF faylı qəbul edilir");
      return;
    }
    if (f.size > uploadLimitMb * 1024 * 1024) {
      setFileError(`Maksimum fayl ölçüsü ${uploadLimitMb} MB-dır`);
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
    if (!formData.category_id) return Swal.fire("Xəta", "Kateqoriya seçilməlidir", "error");
    if ((isBookFiziki || isBookHerIkisi) && !formData.institution_id)
      return Swal.fire("Xəta", "Kitabın saxlanıldığı müəssisəni seçin", "error");
    if (!formData.file && !isBookFiziki) return Swal.fire("Xəta", "PDF faylı seçin", "error");

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("language", formData.language);
    data.append("category_id", formData.category_id);
    data.append("allow_download", isBookFiziki ? "0" : formData.allow_download);
    if ((isBookFiziki || isBookHerIkisi) && formData.institution_id)
      data.append("institution_id", formData.institution_id);
    if (formData.description.trim()) data.append("description", formData.description.trim());
    if (formData.table_of_contents.trim()) data.append("table_of_contents", formData.table_of_contents.trim());
    if (formData.author.trim()) data.append("author", formData.author.trim());
    if (isBookCategory && formData.isbn.trim()) data.append("isbn", formData.isbn.trim());
    if (isBookCategory && formData.publication_year) data.append("publication_year", formData.publication_year);
    if (isBookCategory && formData.publisher_location.trim()) data.append("publisher_location", formData.publisher_location.trim());
    if (isBookCategory && formData.foreword.trim()) data.append("foreword", formData.foreword.trim());
    if (!isBookElektron && formData.price !== "") data.append("price", formData.price);
    if (!isBookCategory && formData.order_number.trim()) data.append("order_number", formData.order_number.trim());
    if (formData.file) data.append("file", formData.file);
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

              {/* PDF adı — tam en */}
              <div className={styles.formGroup}>
                <label htmlFor="title">PDF Adı <span className={styles.required}>*</span></label>
                <input
                  id="title" name="title" type="text"
                  placeholder="PDF-in adını daxil edin"
                  value={formData.title} onChange={handleChange} required
                />
              </div>

              {/* Kateqoriya + Dil */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="category_id">Kateqoriya <span className={styles.required}>*</span></label>
                  <select
                    id="category_id" name="category_id"
                    value={formData.category_id} onChange={handleCategoryChange}
                    className={styles.select} required
                  >
                    <option value="">— Seçin —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="language">Dil <span className={styles.required}>*</span></label>
                  <select
                    id="language" name="language"
                    value={formData.language} onChange={handleChange}
                    className={styles.select}
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Müəssisə — fiziki/hər ikisi kateqoriyasında */}
              {(isBookFiziki || isBookHerIkisi) && (
                <div className={styles.formGroup}>
                  <label htmlFor="institution_id">Müəssisə (kitabın saxlanıldığı kitabxana) <span className={styles.required}>*</span></label>
                  <select
                    id="institution_id" name="institution_id"
                    value={formData.institution_id} onChange={handleChange}
                    className={styles.select} required
                  >
                    <option value="">— Müəssisə seçin —</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Müəllif — kitabda ISBN ilə cüt, başqasında Sıra № ilə cüt */}
              {isBookCategory ? (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="author">Müəllif</label>
                    <input
                      id="author" name="author" type="text"
                      placeholder="Müəllifin adı"
                      value={formData.author} onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="isbn">ISBN <span className={styles.fieldHint}>— Kitab nömrəsi</span></label>
                    <input
                      id="isbn" name="isbn" type="text"
                      placeholder="978-9952-8283-0-1"
                      value={formData.isbn} onChange={handleChange}
                      maxLength={20}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="author">Müəllif</label>
                    <input
                      id="author" name="author" type="text"
                      placeholder="Müəllifin adı"
                      value={formData.author} onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="order_number">Nömrə / Sıra №</label>
                    <input
                      id="order_number" name="order_number" type="text"
                      placeholder="Məs: 45/2025"
                      value={formData.order_number} onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Kitab üçün əlavə sahələr */}
              {isBookCategory && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="publication_year">Nəşr ili</label>
                      <input
                        id="publication_year" name="publication_year" type="number"
                        placeholder="Məs: 2023"
                        value={formData.publication_year} onChange={handleChange}
                        min={1900} max={new Date().getFullYear()}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="publisher_location">Nəşriyyat yeri</label>
                      <input
                        id="publisher_location" name="publisher_location" type="text"
                        placeholder="Məs: Bakı"
                        value={formData.publisher_location} onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="foreword">Ön söz <span style={{ fontSize: "12px", color: "#999" }}>(istəyə bağlı)</span></label>
                    <textarea
                      id="foreword" name="foreword"
                      placeholder="Kitabın ön sözünü buraya daxil edin..."
                      value={formData.foreword} onChange={handleChange}
                      rows={4}
                    />
                  </div>
                  {(!isBookElektron || !isBookFiziki) && (
                  <div className={styles.formRow}>
                    {!isBookElektron && (
                    <div className={styles.formGroup}>
                      <label htmlFor="price">Qiymət (AZN)</label>
                      <input
                        id="price" name="price" type="number"
                        placeholder="0 — pulsuz"
                        value={formData.price} onChange={handleChange}
                        min={0} step="0.01"
                      />
                    </div>
                    )}
                    {!isBookFiziki && (
                    <div className={styles.formGroup}>
                      <label htmlFor="allow_download">Yükləməyə icazə</label>
                      <select
                        id="allow_download" name="allow_download"
                        value={formData.allow_download} onChange={handleChange}
                        className={styles.select}
                      >
                        <option value="1">İcazə var</option>
                        <option value="0">İcazə yoxdur</option>
                      </select>
                    </div>
                    )}
                  </div>
                  )}
                </>
              )}

              {/* Təsvir + Mündəricat */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="description">Təsvir</label>
                  <textarea
                    id="description" name="description"
                    placeholder="PDF haqqında qısa məlumat"
                    value={formData.description} onChange={handleChange} rows={4}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="table_of_contents">Mündəricat</label>
                  <textarea
                    id="table_of_contents" name="table_of_contents"
                    placeholder="Mündericatı buraya yapışdırın..."
                    value={formData.table_of_contents} onChange={handleChange}
                    rows={4}
                    style={{ fontFamily: "monospace", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* PDF faylı + Üz qabığı */}
              <div className={styles.formRow}>
                {!isBookFiziki && (
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
                        <p>Sürükləyin və ya <strong>seçin</strong></p>
                        <small>Maks. {uploadLimitMb} MB</small>
                      </div>
                    )}
                  </div>
                  {fileError && <span className={styles.error}>{fileError}</span>}
                </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="coverImage">Üz qabığı şəkli</label>
                  <div
                    className={`${styles.dropZone} ${formData.coverImage ? styles.hasFile : ""}`}
                    onClick={() => document.getElementById("coverInput").click()}
                    style={{ minHeight: 110 }}
                  >
                    <input
                      id="coverInput" type="file" accept="image/*"
                      onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.files[0] || null }))}
                      style={{ display: "none" }}
                    />
                    {formData.coverImage ? (
                      <div className={styles.fileSelected}>
                        <span>{formData.coverImage.name}</span>
                      </div>
                    ) : (
                      <div className={styles.dropZoneContent}>
                        <p style={{ fontSize: 13 }}>Şəkil seçin <strong>(istəyə bağlı)</strong></p>
                      </div>
                    )}
                  </div>
                </div>
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
