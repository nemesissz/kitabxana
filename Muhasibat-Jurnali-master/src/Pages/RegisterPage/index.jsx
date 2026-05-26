import { useState, useContext, useEffect } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import BookCover from "../../Components/BookCover";

const TILES = [
  { x: "6%",  y: "6%",  w: 118, rot: -6, delay: 0   },
  { x: "34%", y: "2%",  w: 150, rot: 4,  delay: 0.3 },
  { x: "68%", y: "7%",  w: 122, rot: -3, delay: 0.5 },
  { x: "2%",  y: "50%", w: 128, rot: 5,  delay: 0.2 },
  { x: "40%", y: "48%", w: 116, rot: -4, delay: 0.6 },
  { x: "70%", y: "51%", w: 120, rot: 6,  delay: 0.4 },
];

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const RegisterPage = () => {
  const [form, setForm] = useState({ fullName: "", login: "", password: "", confirmPassword: "" });
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loader, setLoader] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [collagePdfs, setCollagePdfs] = useState([]);
  const [stats, setStats] = useState({ pdfs: 0, categories: 0 });
  const store = useContext(dataContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Qeydiyyat — MMU Kitabxana";
    axios.get(Base_Url_Server + "institutions/public")
      .then((r) => setInstitutions(r.data.data.institutions || []))
      .catch(() => {});
    axios.get(Base_Url_Server + "pdfs?limit=6&sortBy=popular&status=approved")
      .then((res) => {
        setCollagePdfs(res.data.data.pdfs || []);
        setStats(s => ({ ...s, pdfs: res.data.data.pagination?.total || 0 }));
      }).catch(() => {});
    axios.get(Base_Url_Server + "categories/pdfs")
      .then((res) => setStats(s => ({ ...s, categories: (res.data.data.categories || []).length })))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  const validate = () => {
    const errors = {};
    if (!form.fullName.trim())          errors.fullName = "Ad Soyad tələb olunur";
    if (!form.login.trim())             errors.login = "İstifadəçi adı tələb olunur";
    if (form.login.trim().length < 3)   errors.login = "Minimum 3 simvol olmalıdır";
    if (form.password.length < 6)       errors.password = "Minimum 6 simvol olmalıdır";
    if (form.password !== form.confirmPassword) errors.confirmPassword = "Şifrələr uyğun gəlmir";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoader(true);
    try {
      const res = await axios.post(Base_Url_Server + "auth/register", {
        fullName: form.fullName.trim(),
        login: form.login.trim(),
        password: form.password,
      });
      const { user, token } = res.data.data;
      if (!user || !token) { setError("Qeydiyyat uğursuz oldu."); setLoader(false); return; }
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user.id));
      store.user.setData(user);
      if (selectedInstitution) {
        try {
          await axios.post(`${Base_Url_Server}institutions/${selectedInstitution}/join-request`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {}
      }
      navigate("/");
    } catch (err) {
      setLoader(false);
      setError(err.response?.data?.message || "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.");
    }
  };

  return (
    <div className={styles.page}>

      {/* ── Sol panel ── */}
      <div className={styles.left}>
        <div className={styles.brand} onClick={() => navigate("/")}>
          <div className={styles.brandMark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div>
            <div className={styles.brandName}>MMU Kitabxana</div>
            <div className={styles.brandSub}>Ağıllı Kitabxana Sistemi</div>
          </div>
        </div>

        <div className={styles.formWrap}>
          <div className={styles.tabRow}>
            <div className={styles.tabs}>
              <button className={styles.tab} onClick={() => navigate("/login")}>Giriş</button>
              <button className={`${styles.tab} ${styles.tabActive}`}>Qeydiyyat</button>
            </div>
            <span className={styles.tabNote}>— HESAB YARAT</span>
          </div>

          <h1 className={styles.heading}>
            Birliyə <span className={styles.accent}>qoşulun.</span>
          </h1>
          <p className={styles.subtext}>
            Hesab yaradaraq kitabxana fonduna, PDF-lərə və üzv imtiyazlarına çatın.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Ad Soyad */}
            <div className={styles.field}>
              <label className={styles.label}>Ad Soyad</label>
              <div className={styles.inputWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.inputIcon}>
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                <input type="text" name="fullName" placeholder="Vusal Seyidli" value={form.fullName} onChange={handleChange} />
              </div>
              {fieldErrors.fullName && <span className={styles.fieldError}>{fieldErrors.fullName}</span>}
            </div>

            {/* İstifadəçi adı */}
            <div className={styles.field}>
              <label className={styles.label}>İstifadəçi adı</label>
              <div className={styles.inputWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.inputIcon}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input type="text" name="login" placeholder="istifadeci.adi" value={form.login} onChange={handleChange} />
              </div>
              {fieldErrors.login && <span className={styles.fieldError}>{fieldErrors.login}</span>}
            </div>

            {/* Şifrə */}
            <div className={styles.field}>
              <label className={styles.label}>Şifrə</label>
              <div className={styles.inputWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input type={showPass ? "text" : "password"} name="password" placeholder="••••••••" value={form.password} onChange={handleChange} />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
              {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
            </div>

            {/* Şifrəni təsdiqlə */}
            <div className={styles.field}>
              <label className={styles.label}>Şifrəni təsdiqlə</label>
              <div className={styles.inputWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input type={showConfirm ? "text" : "password"} name="confirmPassword" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <span className={styles.fieldError}>{fieldErrors.confirmPassword}</span>}
            </div>

            {/* Müəssisə */}
            {institutions.length > 0 && (
              <div className={styles.instSection}>
                <label className={styles.instLabel}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Müəssisə üzvlüyü
                  <span className={styles.instOpt}>İstəyə bağlı</span>
                </label>
                <select
                  className={styles.instSelect}
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                >
                  <option value="">— Seçin (istəyə bağlı) —</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
                {selectedInstitution && (
                  <p className={styles.instHint}>
                    Qeydiyyatdan sonra seçdiyiniz müəssisənin admininə üzvlük sorğusu göndəriləcək.
                  </p>
                )}
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loader}>
              {loader ? "Yüklənir…" : <><span>Hesab yarat</span><span className={styles.arrow}>→</span></>}
            </button>
          </form>

          <p className={styles.switchText} style={{ marginTop: 20 }}>
            Artıq hesabınız var?{" "}
            <button type="button" className={styles.switchBtn} onClick={() => navigate("/login")}>
              Daxil ol
            </button>
          </p>
          <p className={styles.terms}>
            Hesab yaratmaqla <a href="#">istifadə qaydaları</a> və <a href="#">məxfilik siyasəti</a> ilə razılaşırsınız.
          </p>
        </div>
      </div>

      {/* ── Sağ panel ── */}
      <div className={styles.right}>
        <div className={styles.collage}>
          {TILES.map((t, i) => {
            const pdf = collagePdfs[i] || null;
            return (
              <div
                key={i}
                className={styles.tile}
                style={{ left: t.x, top: t.y, width: t.w, '--rot': `rotate(${t.rot}deg)`, animationDelay: `${t.delay}s` }}
              >
                <div className={styles.tileInner}>
                  {pdf
                    ? <BookCover pdf={pdf} />
                    : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,.07)", borderRadius: 8 }} />
                  }
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.panelBottom}>
          <span className={styles.panelEyebrow}>BİRLİYƏ QOŞULUN</span>
          <h2 className={styles.panelHeading}>Yeni bir səhifə açılır sizin üçün.</h2>
          <div className={styles.panelStats}>
            <div>
              <div className={styles.statN}>{stats.pdfs ? `${stats.pdfs}+` : "—"}</div>
              <div className={styles.statL}>PDF RESURS</div>
            </div>
            <div>
              <div className={styles.statN}>{stats.categories || "—"}</div>
              <div className={styles.statL}>KATEQORİYA</div>
            </div>
            <div>
              <div className={styles.statN} style={{ color: "var(--accent)" }}>Pulsuz</div>
              <div className={styles.statL}>UNİVERSİTET ÜZVLƏRI ÜÇÜN</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RegisterPage;
