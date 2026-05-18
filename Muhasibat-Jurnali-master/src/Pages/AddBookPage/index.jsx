import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useLanguages } from "../../Hooks/useLanguages";

function AddBookPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [categories, setCategories] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    table_of_contents: "",
    author: "",
    isbn: "",
    publication_year: "",
    publisher_location: "",
    order_number: "",
    price: "",
    allow_download: "1",
    language: "az",
    categoryId: "",
    institution_id: "",
    foreword: "",
    file: null,
    coverImage: null,
  });

  const { languages } = useLanguages();
  const selectedCatName = categories.find(c => String(c.id) === String(formData.categoryId))?.name || "";
  const catNameLower = selectedCatName.toLowerCase();
  const isBookElektron = catNameLower.includes("kitab-elektron");
  const isBookFiziki   = catNameLower.includes("kitab-fiziki");
  const isBookHerIkisi = catNameLower.includes("kitab-hər ikisi") || catNameLower.includes("kitab-her ikisi");
  const isBookCategory = isBookElektron || isBookFiziki || isBookHerIkisi;

  // Scope: non-main institution admins must submit requests instead of direct upload
  const adminData = store.admin.data;
  const adminRole = adminData?.role ?? 0;
  const adminInstId = adminData?.institutionId ?? null;
  const adminInst = institutions.find(i => i.id === adminInstId);
  const isNonMain = adminRole < 4 && !!adminInstId && institutions.length > 0 && !adminInst?.is_main;
  const uploadPermission = adminData?.uploadPermission || 'pending';

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    if (!tokenAdmin) { navigate("/admin/login"); return; }

    if (!formData.title.trim()) return Swal.fire("Xəta", "Başlıq tələb olunur", "error");
    if (!formData.categoryId) return Swal.fire("Xəta", "Kateqoriya seçilməlidir", "error");
    if ((isBookFiziki || isBookHerIkisi) && !formData.institution_id)
      return Swal.fire("Xəta", "Kitabın saxlanıldığı müəssisəni seçin", "error");
    if (!formData.file && !isBookFiziki) return Swal.fire("Xəta", "PDF faylı seçin", "error");

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("language", formData.language);
    // createPdf uses "categoryId"; submitPdf uses "category_id"
    data.append(isNonMain ? "category_id" : "categoryId", formData.categoryId);
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
    if (!isBookCategory && formData.order_number.trim()) data.append("order_number", formData.order_number.trim());
    if (!isBookElektron && formData.price !== "") data.append("price", formData.price);
    if (formData.file) data.append("file", formData.file);
    if (formData.coverImage) data.append("coverImage", formData.coverImage);

    try {
      setLoader(true);
      const endpoint = isNonMain ? `${Base_Url_Server}pdfs/submit` : `${Base_Url_Server}pdfs`;
      await axios.post(endpoint, data, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${tokenAdmin}` },
      });
      const showAsRequest = isNonMain && uploadPermission === 'pending';
      if (showAsRequest) {
        Swal.fire({ icon: "success", title: "Sorğu göndərildi!", text: "Sorğunuz admin tərəfindən nəzərdən keçiriləcək.", showConfirmButton: false, timer: 2000 });
      } else {
        Swal.fire({ icon: "success", title: "Uğurlu!", text: "PDF uğurla əlavə edildi.", showConfirmButton: false, timer: 1500 });
      }
      setTimeout(() => navigate("/admin/library"), showAsRequest ? 2000 : 1500);
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Əlavə etmə zamanı xəta baş verdi.", "error");
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { store.admin.setData(null); navigate("/admin/login"); return; }
    axios.get(Base_Url_Server + "users/" + adminID, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then(r => store.admin.setData(r.data.data.user))
      .catch(err => { if (err.response?.status === 401) { navigate("/admin/login"); } });
  }, []);

  useEffect(() => {
    axios.get(`${Base_Url_Server}categories/pdfs`)
      .then(res => setCategories(res.data.data.categories || []))
      .catch(() => {});
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    axios.get(`${Base_Url_Server}institutions`, { headers: { Authorization: `Bearer ${tokenAdmin}` } })
      .then(res => setInstitutions(res.data.data.institutions || []))
      .catch(() => {});
  }, []);

  return (
    <div className={styles.addBookPage}>
      <div className={styles.addBook}>
        <h2>Yeni PDF Əlavə Et</h2>
        {isNonMain && uploadPermission === 'none' && (
          <div className={styles.infoBanner} style={{ background: '#fee2e2', borderColor: '#ef4444', color: '#dc2626' }}>
            ⛔ PDF yükləmə icazəniz yoxdur. Sistem inzibatçısı ilə əlaqə saxlayın.
          </div>
        )}
        {isNonMain && uploadPermission === 'pending' && (
          <div className={styles.infoBanner}>
            ℹ️ Müəssisəniz birbaşa PDF əlavə etməyə icazəli deyil. Forma göndərildikdə sorğu kimi qeydə alınacaq və admin tərəfindən nəzərdən keçiriləcək.
          </div>
        )}
        {isNonMain && uploadPermission === 'free' && (
          <div className={styles.infoBanner} style={{ background: '#dcfce7', borderColor: '#16a34a', color: '#166534' }}>
            ✅ Birbaşa PDF yükləmə icazəniz var. Yüklədiyiniz PDF-lər dərhal əlavə olunacaq.
          </div>
        )}
        {isNonMain && uploadPermission === 'none' ? null : (
        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Başlıq — tam en */}
          <div className={styles.formGroup}>
            <label>Başlıq <span className={styles.required}>*</span></label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="PDF adını daxil edin" required />
          </div>

          {/* Kateqoriya + Dil */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Kateqoriya <span className={styles.required}>*</span></label>
              <select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                <option value="">— Seçin —</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Dil <span className={styles.required}>*</span></label>
              <select name="language" value={formData.language} onChange={handleChange}>
                {languages.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
          </div>

          {/* Müəssisə — fiziki/hər ikisi kateqoriyasında */}
          {(isBookFiziki || isBookHerIkisi) && (
            <div className={styles.formGroup}>
              <label>Müəssisə (kitabın saxlanıldığı kitabxana) <span className={styles.required}>*</span></label>
              <select name="institution_id" value={formData.institution_id} onChange={handleChange} required>
                <option value="">— Müəssisə seçin —</option>
                {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
              </select>
            </div>
          )}

          {/* Kitab kateqoriyası: Müəllif + ISBN */}
          {isBookCategory ? (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Müəllif</label>
                <input type="text" name="author" value={formData.author} onChange={handleChange} placeholder="Müəllifin adı" />
              </div>
              <div className={styles.formGroup}>
                <label>ISBN</label>
                <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} placeholder="978-9952-8283-0-1" maxLength={20} />
              </div>
            </div>
          ) : (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Müəllif</label>
                <input type="text" name="author" value={formData.author} onChange={handleChange} placeholder="Müəllifin adı" />
              </div>
              <div className={styles.formGroup}>
                <label>Nömrə / Sıra №</label>
                <input type="text" name="order_number" value={formData.order_number} onChange={handleChange} placeholder="Məs: 45/2025" />
              </div>
            </div>
          )}

          {/* Kitab üçün: Nəşr ili + Nəşriyyat yeri */}
          {isBookCategory && (
            <>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Nəşr ili</label>
                <input type="number" name="publication_year" value={formData.publication_year} onChange={handleChange} placeholder="Məs: 2023" min={1900} max={new Date().getFullYear()} />
              </div>
              <div className={styles.formGroup}>
                <label>Nəşriyyat yeri</label>
                <input type="text" name="publisher_location" value={formData.publisher_location} onChange={handleChange} placeholder="Məs: Bakı" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Ön söz <span className={styles.fieldHint}>(istəyə bağlı)</span></label>
              <textarea name="foreword" value={formData.foreword} onChange={handleChange} rows={4} placeholder="Kitabın ön sözünü buraya daxil edin..." />
            </div>
            </>
          )}

          {/* Qiymət + Yükləməyə icazə */}
          {(!isBookElektron || !isBookFiziki) && (
          <div className={styles.formRow}>
            {!isBookElektron && (
              <div className={styles.formGroup}>
                <label>Qiymət (AZN)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0 — pulsuz" min={0} step="0.01" />
              </div>
            )}
            {!isBookFiziki && (
              <div className={styles.formGroup}>
                <label>Yükləməyə icazə</label>
                <select name="allow_download" value={formData.allow_download} onChange={handleChange}>
                  <option value="1">İcazə var</option>
                  <option value="0">İcazə yoxdur</option>
                </select>
              </div>
            )}
          </div>
          )}

          {/* Təsvir + Mündəricat */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Təsvir</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="PDF haqqında qısa məlumat" />
            </div>
            <div className={styles.formGroup}>
              <label>Mündəricat</label>
              <textarea name="table_of_contents" value={formData.table_of_contents} onChange={handleChange} rows={4} placeholder="Mündericatı buraya yapışdırın..." style={{ fontFamily: "monospace", fontSize: "13px" }} />
            </div>
          </div>

          {/* PDF faylı + Üz qabığı */}
          <div className={styles.formRow}>
            {!isBookFiziki && (
            <div className={styles.formGroup}>
              <label>PDF Faylı <span className={styles.required}>*</span></label>
              <label className={`${styles.fileZone} ${formData.file ? styles.hasFile : ""}`}>
                <input type="file" accept="application/pdf" onChange={e => setFormData(p => ({ ...p, file: e.target.files[0] || null }))} style={{ display: "none" }} />
                {formData.file ? (
                  <span className={styles.fileName}><UploadFileIcon fontSize="small" /> {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(1)} MB)</span>
                ) : (
                  <span className={styles.filePlaceholder}><UploadFileIcon /> Seçin və ya sürükləyin</span>
                )}
              </label>
            </div>
            )}
            <div className={styles.formGroup}>
              <label>Üz qabığı şəkli</label>
              <label className={`${styles.fileZone} ${formData.coverImage ? styles.hasFile : ""}`}>
                <input type="file" accept="image/*" onChange={e => setFormData(p => ({ ...p, coverImage: e.target.files[0] || null }))} style={{ display: "none" }} />
                {formData.coverImage ? (
                  <span className={styles.fileName}>{formData.coverImage.name}</span>
                ) : (
                  <span className={styles.filePlaceholder}>Şəkil seçin (istəyə bağlı)</span>
                )}
              </label>
              {formData.coverImage && (
                <img src={URL.createObjectURL(formData.coverImage)} alt="preview" className={styles.coverPreview} />
              )}
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loader}>
            {loader ? <CircularProgress size={18} style={{ color: "#fff", marginRight: 8 }} /> : null}
            {loader ? "Əlavə edilir..." : "PDF-i Əlavə Et"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

export default AddBookPage;
