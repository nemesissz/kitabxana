import { useContext, useEffect, useState } from "react";
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

const LoginPage = () => {
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loader, setLoader] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [collagePdfs, setCollagePdfs] = useState([]);
  const [stats, setStats] = useState({ pdfs: 0, categories: 0 });
  const store = useContext(dataContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Giriş — MMU Kitabxana";
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (token && userID) {
      axios.get(Base_Url_Server + "users/" + userID, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => { store.user.setData(res.data.data.user); navigate("/"); })
        .catch((err) => {
          if (err.response?.status === 401) {
            store.user.setData(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        });
    }
    axios.get(Base_Url_Server + "pdfs?limit=6&sortBy=popular&status=approved")
      .then((res) => {
        setCollagePdfs(res.data.data.pdfs || []);
        setStats(s => ({ ...s, pdfs: res.data.data.pagination?.total || 0 }));
      }).catch(() => {});
    axios.get(Base_Url_Server + "categories/pdfs")
      .then((res) => setStats(s => ({ ...s, categories: (res.data.data.categories || []).length })))
      .catch(() => {});
  }, []);

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoader(true);
    axios.post(Base_Url_Server + "auth/login", form)
      .then((res) => {
        setLoader(false);
        if (res.data.data.user.role < 1) { setError("Bu hesab tapılmadı."); return; }
        localStorage.setItem("token", res.data.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.data.user.id));
        store.user.setData(res.data.data.user);
        window.location.href = "/";
      })
      .catch((err) => {
        setLoader(false);
        setError(err.response?.data?.message || "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.");
      });
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
              <button className={`${styles.tab} ${styles.tabActive}`}>Giriş</button>
              <button className={styles.tab} onClick={() => navigate("/register")}>Qeydiyyat</button>
            </div>
            <span className={styles.tabNote}>— XOŞ GƏLMİSİNİZ</span>
          </div>

          <h1 className={styles.heading}>
            Yenidən <span className={styles.accent}>içəri.</span>
          </h1>
          <p className={styles.subtext}>
            Hesabınıza giriş edərək kitabxana fonduna və profilinizə çatın.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>İstifadəçi adı</label>
              <div className={styles.inputWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.inputIcon}>
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                <input type="text" name="login" placeholder="istifadeci.adi" value={form.login} onChange={handleChange} required />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Şifrə</label>
              <div className={styles.inputWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input type={showPass ? "text" : "password"} name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <div className={styles.checkRow}>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                <span>Məni xatırla</span>
              </label>
              <button type="button" className={styles.forgotBtn}>Şifrəni unutmusunuz?</button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loader}>
              {loader ? "Yüklənir…" : <><span>Daxil ol</span><span className={styles.arrow}>→</span></>}
            </button>
          </form>

          <div className={styles.divider}><span>VƏ YA</span></div>

          <div className={styles.ssoRow}>
            <button className={styles.ssoBtn}>
              <span className={styles.ssoDot} style={{ background: "#0B1F3D" }} />
              MMU SSO
            </button>
            <button className={styles.ssoBtn}>
              <span className={styles.ssoDot} style={{ background: "#1a7a3a" }} />
              e-Gov
            </button>
          </div>

          <p className={styles.switchText}>
            Hesabınız yoxdur?{" "}
            <button type="button" className={styles.switchBtn} onClick={() => navigate("/register")}>
              İndi qeydiyyatdan keçin
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
          <span className={styles.panelEyebrow}>YENİDƏN XOŞ GƏLDİNİZ</span>
          <h2 className={styles.panelHeading}>Bilik xəzinəniz sizi gözləyir.</h2>
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

export default LoginPage;
