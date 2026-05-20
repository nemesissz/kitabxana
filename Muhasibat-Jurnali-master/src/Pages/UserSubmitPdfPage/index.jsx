import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import Swal from "sweetalert2";
import Footer from "../../Layouts/Footer";
import { useLanguages } from "../../Hooks/useLanguages";

const STEPS = [
  { n: 1, label: "Əsas məlumat" },
  { n: 2, label: "Ətraflı məlumat" },
  { n: 3, label: "Fayllar" },
  { n: 4, label: "Yoxla & Göndər" },
];

const PALETTES = [
  ["#3D2914","#7A4A26"], ["#1F3A2E","#3A6B53"], ["#8B1A1A","#C0392B"],
  ["#1A2B4A","#3E5B8B"], ["#0B4F6C","#0F7895"], ["#5B3A1F","#8E6840"],
  ["#2D1B4E","#5A3D8A"], ["#1B3A1B","#2E7D32"],
];

function UserSubmitPdfPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [step, setStep] = useState(1);
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
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const { languages } = useLanguages();

  useEffect(() => {
    document.title = "PDF Yüklə — MMU Kitabxana";
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) { navigate("/login"); return; }
    axios
      .get(Base_Url_Server + "users/" + userID, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const userData = res.data.data.user;
        store.user.setData(userData);
        if (!userData.uploadPermission || userData.uploadPermission === "none") {
          Swal.fire({
            icon: "warning", title: "İcazə yoxdur",
            text: "PDF yükləmə icazəniz yoxdur. Adminlə əlaqə saxlayın.",
            confirmButtonColor: "#0B1F3D",
          }).then(() => navigate("/library/all"));
          return;
        }
        axios
          .get(Base_Url_Server + "settings/upload-limits/me", { headers: { Authorization: `Bearer ${token}` } })
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
    axios.get(Base_Url_Server + "categories/pdfs")
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => {});
  }, []);

  const selectedCatName = categories.find((c) => String(c.id) === String(formData.category_id))?.name || "";
  const catNameLower = selectedCatName.toLowerCase();
  const isBookElektron = catNameLower.includes("kitab-elektron");
  const isBookFiziki   = catNameLower.includes("kitab-fiziki");
  const isBookHerIkisi = catNameLower.includes("kitab-hər ikisi") || catNameLower.includes("kitab-her ikisi");
  const isBookCategory = isBookElektron || isBookFiziki || isBookHerIkisi;

  useEffect(() => {
    if (isBookFiziki || isBookHerIkisi) {
      axios.get(Base_Url_Server + "institutions/public")
        .then((res) => setInstitutions(res.data.data?.institutions || res.data.data || []))
        .catch(() => {});
    }
  }, [isBookFiziki, isBookHerIkisi]);

  useEffect(() => {
    if (formData.coverImage) {
      const url = URL.createObjectURL(formData.coverImage);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCoverPreviewUrl(null);
    }
  }, [formData.coverImage]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateAndSetFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { setFileError("Yalnız PDF faylı qəbul edilir"); return; }
    if (f.size > uploadLimitMb * 1024 * 1024) { setFileError(`Maksimum fayl ölçüsü ${uploadLimitMb} MB-dır`); return; }
    setFileError("");
    setFormData((prev) => ({ ...prev, file: f }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!formData.title.trim()) { Swal.fire({ icon: "warning", title: "Xəta", text: "PDF adı tələb olunur", confirmButtonColor: "#0B1F3D" }); return false; }
      if (!formData.category_id) { Swal.fire({ icon: "warning", title: "Xəta", text: "Kateqoriya seçilməlidir", confirmButtonColor: "#0B1F3D" }); return false; }
    }
    if (s === 2) {
      if ((isBookFiziki || isBookHerIkisi) && !formData.institution_id) {
        Swal.fire({ icon: "warning", title: "Xəta", text: "Kitabın saxlanıldığı müəssisəni seçin", confirmButtonColor: "#0B1F3D" });
        return false;
      }
    }
    if (s === 3) {
      if (!formData.file && !isBookFiziki) {
        Swal.fire({ icon: "warning", title: "Xəta", text: "PDF faylı seçin", confirmButtonColor: "#0B1F3D" });
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 4));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("language", formData.language);
    data.append("category_id", formData.category_id);
    data.append("allow_download", isBookFiziki ? "0" : formData.allow_download);
    if ((isBookFiziki || isBookHerIkisi) && formData.institution_id) data.append("institution_id", formData.institution_id);
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
        icon: "success", title: "Uğurlu!",
        text: isPending
          ? "PDF uğurla yükləndi. Admin təsdiqlədikdən sonra kitabxanada görünəcək."
          : "PDF uğurla yükləndi və kitabxanaya əlavə edildi.",
        confirmButtonColor: "#0B1F3D",
      });
      navigate("/library/all");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Xəta", text: err.response?.data?.message || "Xəta baş verdi", confirmButtonColor: "#0B1F3D" });
    } finally {
      setLoader(false);
    }
  };

  const [c1, c2] = PALETTES[1];

  return (
    <>
      <main>
        {/* ── Hero strip ── */}
        <section className={styles.heroStrip}>
          <div className="mmu-container">
            <span className="mmu-eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9m0 0 5 5m-5-5-5 5"/><path d="M5 3h14"/></svg>
              PDF Yüklə
            </span>
            <h1 className={styles.heroTitle}>Kitabxanaya töhfə verin</h1>
            <p className="mmu-lead">Sənədinizi yükləyin — bir neçə addım, işiniz bitdi.</p>
          </div>
        </section>

        {/* ── Stepper ── */}
        <div className={styles.stepperBar}>
          <div className="mmu-container">
            <div className={styles.stepper}>
              {STEPS.map((s, i) => {
                const done = step > s.n;
                const active = step === s.n;
                return (
                  <div key={s.n} className={styles.stepItem}>
                    {i > 0 && <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ""}`} />}
                    <div className={`${styles.stepCircle} ${active ? styles.stepCircleActive : ""} ${done ? styles.stepCircleDone : ""}`}>
                      {done ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : s.n}
                    </div>
                    <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ""}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Form area ── */}
        <section className={styles.formSection}>
          <div className="mmu-container">
            <div className={styles.layout}>

              {/* Main form */}
              <div className={styles.formWrap}>

                {/* Step 1 */}
                {step === 1 && (
                  <div className={styles.formCard}>
                    <h2 className={styles.stepTitle}>Əsas məlumat</h2>

                    <div className={styles.field}>
                      <label className={styles.label}>
                        PDF Adı <span className={styles.req}>*</span>
                      </label>
                      <input
                        className="mmu-input"
                        name="title" type="text"
                        placeholder="PDF-in adını daxil edin"
                        value={formData.title} onChange={handleChange}
                      />
                    </div>

                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>
                          Kateqoriya <span className={styles.req}>*</span>
                        </label>
                        <select
                          className="mmu-input mmu-select"
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleChange}
                        >
                          <option value="">— Seçin —</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>Dil <span className={styles.req}>*</span></label>
                        <select
                          className="mmu-input mmu-select"
                          name="language"
                          value={formData.language} onChange={handleChange}
                        >
                          {languages.map((l) => (
                            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>Müəllif</label>
                        <input
                          className="mmu-input"
                          name="author" type="text"
                          placeholder="Müəllifin adı"
                          value={formData.author} onChange={handleChange}
                        />
                      </div>
                      {!isBookCategory && (
                        <div className={styles.field}>
                          <label className={styles.label}>Nömrə / Sıra №</label>
                          <input
                            className="mmu-input"
                            name="order_number" type="text"
                            placeholder="Məs: 45/2025"
                            value={formData.order_number} onChange={handleChange}
                          />
                        </div>
                      )}
                    </div>

                    {(isBookFiziki || isBookHerIkisi) && (
                      <div className={styles.field}>
                        <label className={styles.label}>
                          Müəssisə (kitabın saxlanıldığı yer) <span className={styles.req}>*</span>
                        </label>
                        <select
                          className="mmu-input mmu-select"
                          name="institution_id"
                          value={formData.institution_id} onChange={handleChange}
                        >
                          <option value="">— Müəssisə seçin —</option>
                          {institutions.map((inst) => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className={styles.formCard}>
                    <h2 className={styles.stepTitle}>Ətraflı məlumat</h2>

                    <div className={styles.field}>
                      <label className={styles.label}>Təsvir</label>
                      <textarea
                        className="mmu-input"
                        name="description"
                        placeholder="PDF haqqında qısa məlumat"
                        value={formData.description} onChange={handleChange} rows={4}
                        style={{ resize: "vertical" }}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Mündəricat</label>
                      <textarea
                        className="mmu-input"
                        name="table_of_contents"
                        placeholder="Mündericatı buraya yapışdırın…"
                        value={formData.table_of_contents} onChange={handleChange}
                        rows={5}
                        style={{ fontFamily: "monospace", fontSize: "13px", resize: "vertical" }}
                      />
                    </div>

                    {isBookCategory && (
                      <>
                        <div className={styles.row}>
                          <div className={styles.field}>
                            <label className={styles.label}>ISBN</label>
                            <input
                              className="mmu-input"
                              name="isbn" type="text"
                              placeholder="978-9952-8283-0-1"
                              value={formData.isbn} onChange={handleChange} maxLength={20}
                            />
                          </div>
                          <div className={styles.field}>
                            <label className={styles.label}>Nəşr ili</label>
                            <input
                              className="mmu-input"
                              name="publication_year" type="number"
                              placeholder="Məs: 2023"
                              value={formData.publication_year} onChange={handleChange}
                              min={1900} max={new Date().getFullYear()}
                            />
                          </div>
                        </div>

                        <div className={styles.row}>
                          <div className={styles.field}>
                            <label className={styles.label}>Nəşriyyat yeri</label>
                            <input
                              className="mmu-input"
                              name="publisher_location" type="text"
                              placeholder="Məs: Bakı"
                              value={formData.publisher_location} onChange={handleChange}
                            />
                          </div>
                          {!isBookElektron && (
                            <div className={styles.field}>
                              <label className={styles.label}>Qiymət (AZN)</label>
                              <input
                                className="mmu-input"
                                name="price" type="number"
                                placeholder="0 — pulsuz"
                                value={formData.price} onChange={handleChange}
                                min={0} step="0.01"
                              />
                            </div>
                          )}
                        </div>

                        {!isBookFiziki && (
                          <div className={styles.field}>
                            <label className={styles.label}>Yükləməyə icazə</label>
                            <select
                              className="mmu-input mmu-select"
                              name="allow_download"
                              value={formData.allow_download} onChange={handleChange}
                            >
                              <option value="1">İcazə var</option>
                              <option value="0">İcazə yoxdur</option>
                            </select>
                          </div>
                        )}

                        <div className={styles.field}>
                          <label className={styles.label}>Ön söz <span className={styles.hint}>(istəyə bağlı)</span></label>
                          <textarea
                            className="mmu-input"
                            name="foreword"
                            placeholder="Kitabın ön sözünü buraya daxil edin…"
                            value={formData.foreword} onChange={handleChange}
                            rows={4}
                            style={{ resize: "vertical" }}
                          />
                        </div>
                      </>
                    )}

                    {!isBookCategory && (
                      <div className={styles.row}>
                        <div className={styles.field}>
                          <label className={styles.label}>Qiymət (AZN)</label>
                          <input
                            className="mmu-input"
                            name="price" type="number"
                            placeholder="0 — pulsuz"
                            value={formData.price} onChange={handleChange}
                            min={0} step="0.01"
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Yükləməyə icazə</label>
                          <select
                            className="mmu-input mmu-select"
                            name="allow_download"
                            value={formData.allow_download} onChange={handleChange}
                          >
                            <option value="1">İcazə var</option>
                            <option value="0">İcazə yoxdur</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className={styles.formCard}>
                    <h2 className={styles.stepTitle}>Fayllar</h2>

                    {!isBookFiziki && (
                      <div className={styles.field}>
                        <label className={styles.label}>
                          PDF Faylı <span className={styles.req}>*</span>
                        </label>
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
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              <div>
                                <div className={styles.fileName}>{formData.file.name}</div>
                                <div className={styles.fileSize}>{(formData.file.size / 1024 / 1024).toFixed(2)} MB</div>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.dropZoneContent}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              <p>Sürükləyin və ya <strong>seçin</strong></p>
                              <small>Maks. {uploadLimitMb} MB · PDF</small>
                            </div>
                          )}
                        </div>
                        {fileError && <span className={styles.fieldError}>{fileError}</span>}
                      </div>
                    )}

                    <div className={styles.field}>
                      <label className={styles.label}>Üz qabığı şəkli <span className={styles.hint}>(istəyə bağlı)</span></label>
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
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <div>
                              <div className={styles.fileName}>{formData.coverImage.name}</div>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.dropZoneContent}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <p>Şəkil seçin <strong>(istəyə bağlı)</strong></p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4 — Review */}
                {step === 4 && (
                  <div className={styles.formCard}>
                    <h2 className={styles.stepTitle}>Yoxla &amp; Göndər</h2>
                    <div className={styles.reviewGrid}>
                      {[
                        { l: "Başlıq",       v: formData.title },
                        { l: "Kateqoriya",   v: categories.find(c => String(c.id) === String(formData.category_id))?.name },
                        { l: "Dil",          v: formData.language },
                        { l: "Müəllif",      v: formData.author },
                        { l: "Nəşr ili",     v: formData.publication_year },
                        { l: "ISBN",         v: formData.isbn },
                        { l: "Qiymət",       v: formData.price ? `${formData.price} AZN` : "Pulsuz" },
                        { l: "PDF faylı",    v: formData.file?.name },
                        { l: "Üz qabığı",    v: formData.coverImage?.name },
                      ].filter(item => item.v).map(({ l, v }) => (
                        <div key={l} className={styles.reviewRow}>
                          <span className={styles.reviewKey}>{l}</span>
                          <span className={styles.reviewVal}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {formData.description && (
                      <div className={styles.reviewDesc}>
                        <p className={styles.reviewKey}>Təsvir</p>
                        <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, marginTop: 6 }}>{formData.description}</p>
                      </div>
                    )}

                    <button
                      className={styles.submitBtn}
                      onClick={handleSubmit}
                      disabled={loader}
                    >
                      {loader ? (
                        <>
                          <span className={styles.btnSpinner} />
                          Yüklənir…
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9m0 0 5 5m-5-5-5 5"/><path d="M5 3h14"/></svg>
                          PDF-i Kitabxanaya Göndər
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <div className={styles.navRow}>
                  {step > 1 && (
                    <button
                      className="mmu-btn mmu-btn-outline"
                      onClick={() => setStep(s => s - 1)}
                    >
                      ← Geri
                    </button>
                  )}
                  {step < 4 && (
                    <button
                      className="mmu-btn mmu-btn-primary"
                      style={{ marginLeft: "auto" }}
                      onClick={goNext}
                    >
                      İrəli →
                    </button>
                  )}
                </div>
              </div>

              {/* Preview sidebar */}
              <aside className={styles.preview}>
                <p className={styles.previewLabel}>Canlı önbaxış</p>
                <div className={styles.previewCover}>
                  {coverPreviewUrl ? (
                    <img src={coverPreviewUrl} alt="Üz qabığı" />
                  ) : (
                    <div
                      className={styles.previewGradient}
                      style={{ background: `linear-gradient(150deg, ${c1}, ${c2})` }}
                    >
                      <span className={styles.previewTitle}>{formData.title || "PDF adı"}</span>
                      {formData.author && <span className={styles.previewAuthor}>{formData.author}</span>}
                    </div>
                  )}
                </div>
                <div className={styles.previewMeta}>
                  <strong>{formData.title || "—"}</strong>
                  {formData.author && <span>{formData.author}</span>}
                  {selectedCatName && <span className="mmu-badge mmu-badge-accent" style={{ marginTop: 6 }}>{selectedCatName}</span>}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default UserSubmitPdfPage;
