import { useContext, useEffect, useState, useRef } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import Swal from "sweetalert2";
import { matchLanguages } from "../../Constants/knownLanguages";
import "flag-icons/css/flag-icons.min.css";

function AdminLanguagesPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();

  const [institutions, setInstitutions] = useState([]);
  const [isNonMain, setIsNonMain] = useState(null);

  const [languages, setLanguages] = useState([]);
  const [langInput, setLangInput] = useState("");
  const [langSuggestions, setLangSuggestions] = useState([]);
  const [selectedLang, setSelectedLang] = useState(null);
  const [langLoader, setLangLoader] = useState(false);
  const langInputRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [reqInput, setReqInput] = useState("");
  const [reqSuggestions, setReqSuggestions] = useState([]);
  const [selectedReqLang, setSelectedReqLang] = useState(null);
  const [reqLoader, setReqLoader] = useState(false);

  // Auth
  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { navigate("/admin/login"); return; }
    axios.get(Base_Url_Server + "users/" + adminID, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then(res => store.admin.setData(res.data.data.user))
      .catch(err => { if (err.response?.status === 401) navigate("/admin/login"); });
  }, []);

  // Load languages + institutions
  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    store.loader.setData(true);
    Promise.all([
      axios.get(Base_Url_Server + "languages"),
      axios.get(Base_Url_Server + "institutions", {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      }).catch(() => ({ data: { data: { institutions: [] } } })),
    ]).then(([langRes, instRes]) => {
      setLanguages(langRes.data.data.languages || []);
      setInstitutions(instRes.data.data.institutions || []);
    }).finally(() => store.loader.setData(false));
  }, []);

  // Determine scope
  useEffect(() => {
    const admin = store.admin.data;
    if (!admin) return;
    if (institutions.length === 0 && !admin.institutionId) { setIsNonMain(false); return; }
    if (institutions.length === 0) return;
    const role = admin.role ?? 0;
    const institutionId = admin.institutionId ?? null;
    if (role >= 4 || !institutionId) { setIsNonMain(false); return; }
    const inst = institutions.find(i => i.id === institutionId);
    // Only manager (role>=3) from main institution gets global scope
    if (inst?.is_main && role >= 3) { setIsNonMain(false); return; }
    setIsNonMain(true);
  }, [store.admin.data, institutions]);

  // Load requests once scope is known
  useEffect(() => {
    if (isNonMain === null) return;
    loadRequests();
  }, [isNonMain]);

  const loadLanguages = () => {
    axios.get(Base_Url_Server + "languages")
      .then(res => setLanguages(res.data.data.languages || []))
      .catch(() => {});
  };

  const loadRequests = async () => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    setRequestsLoading(true);
    try {
      const url = isNonMain
        ? Base_Url_Server + "languages/requests/mine"
        : Base_Url_Server + "languages/requests";
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${tokenAdmin}` } });
      setRequests(res.data.data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  // --- Global admin: add directly ---
  const handleLangInputChange = (e) => {
    const val = e.target.value;
    setLangInput(val);
    setSelectedLang(null);
    setLangSuggestions(matchLanguages(val));
  };

  const handleSelectSuggestion = (lang) => {
    setSelectedLang(lang);
    setLangInput(`${lang.emoji || ""} ${lang.name} (${lang.code})`);
    setLangSuggestions([]);
  };

  const handleAddLanguage = async (e) => {
    e.preventDefault();
    if (!selectedLang) return Swal.fire("Xəta", "Siyahıdan dil seçin", "warning");
    setLangLoader(true);
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      const { emoji: _e, aliases: _a, ...langPayload } = selectedLang;
      await axios.post(Base_Url_Server + "languages", langPayload, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setLangInput(""); setSelectedLang(null); setLangSuggestions([]);
      loadLanguages();
      Swal.fire({ icon: "success", title: "Dil əlavə edildi", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta", err.response?.data?.message || "Əlavə edilə bilmədi", "error");
    } finally {
      setLangLoader(false);
    }
  };

  const handleDeleteLanguage = async (id, name) => {
    const res = await Swal.fire({
      title: `"${name}" dilini silmək istəyirsiniz?`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli, sil", cancelButtonText: "Ləğv et",
    });
    if (!res.isConfirmed) return;
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      await axios.delete(Base_Url_Server + "languages/" + id, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      loadLanguages();
    } catch (err) {
      Swal.fire("Xəta", err.response?.data?.message || "Silinə bilmədi", "error");
    }
  };

  // --- Non-main admin: submit request ---
  const handleReqInputChange = (e) => {
    const val = e.target.value;
    setReqInput(val);
    setSelectedReqLang(null);
    setReqSuggestions(matchLanguages(val));
  };

  const handleSelectReqSuggestion = (lang) => {
    setSelectedReqLang(lang);
    setReqInput(`${lang.emoji || ""} ${lang.name} (${lang.code})`);
    setReqSuggestions([]);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedReqLang) return Swal.fire("Xəta", "Siyahıdan dil seçin", "warning");
    setReqLoader(true);
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      const { emoji: _e, aliases: _a, ...payload } = selectedReqLang;
      await axios.post(Base_Url_Server + "languages/requests", payload, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setReqInput(""); setSelectedReqLang(null); setReqSuggestions([]);
      await loadRequests();
      Swal.fire({ icon: "success", title: "Sorğu göndərildi", text: "Superadmin təsdiqini gözləyin", timer: 2500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta", err.response?.data?.message || "Sorğu göndərilə bilmədi", "error");
    } finally {
      setReqLoader(false);
    }
  };

  // --- Global admin: approve / reject ---
  const handleApprove = async (reqId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.patch(`${Base_Url_Server}languages/requests/${reqId}/approve`, {}, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      await loadRequests();
      loadLanguages();
      Swal.fire({ icon: "success", title: "Təsdiqləndi", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta", err.response?.data?.message || "Əməliyyat alınmadı", "error");
    }
  };

  const handleReject = async (reqId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.patch(`${Base_Url_Server}languages/requests/${reqId}/reject`, {}, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      await loadRequests();
      Swal.fire({ icon: "success", title: "Rədd edildi", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta", err.response?.data?.message || "Əməliyyat alınmadı", "error");
    }
  };

  const languagePermission = store.admin.data?.languagePermission || 'request';
  const canDirect = !isNonMain || languagePermission === 'direct';

  if (isNonMain === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h2 className={styles.title}>Dillər</h2>

        {/* Non-main, no access */}
        {isNonMain && languagePermission === 'none' && (
          <div className={styles.infoBanner} style={{ borderColor: '#e74c3c', background: '#fff5f5', color: '#c0392b' }}>
            ⛔ Dil yaratma icazəniz yoxdur.
          </div>
        )}

        {/* Non-main admin: info + request form */}
        {isNonMain && languagePermission === 'request' && (
          <>
            <div className={styles.infoBanner}>
              ℹ️ Dil əlavə etmə birbaşa edilə bilməz — sorğu göndərin, superadmin təsdiqləsin.
            </div>
            <form onSubmit={handleSubmitRequest}>
              <div className={styles.inputGroup} style={{ position: "relative" }}>
                <label>Dil sorğusu göndər</label>
                <input
                  type="text"
                  value={reqInput}
                  onChange={handleReqInputChange}
                  onBlur={() => setTimeout(() => setReqSuggestions([]), 150)}
                  placeholder='Məs: "azer", "turk", "ing"...'
                  className={styles.input}
                  autoComplete="off"
                />
                {reqSuggestions.length > 0 && (
                  <div className={styles.suggestionList}>
                    {reqSuggestions.map(lang => (
                      <div key={lang.code} className={styles.suggestionItem}
                        onMouseDown={() => handleSelectReqSuggestion(lang)}>
                        <span className={styles.suggestionFlag}>{lang.emoji || lang.flag}</span>
                        <span>{lang.name}</span>
                        <span className={styles.suggestionCode}>{lang.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.buttonsWrapper}>
                <button type="submit" className={styles.button}
                  style={{ background: selectedReqLang ? "#7c3aed" : "#aaa" }}
                  disabled={!selectedReqLang || reqLoader}>
                  {reqLoader ? <CircularProgress size={20} style={{ color: "#fff" }} /> : "Sorğu göndər"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Direct add form (global admin OR non-main with 'direct' permission) */}
        {canDirect && (
          <form onSubmit={handleAddLanguage}>
            <div className={styles.inputGroup} style={{ position: "relative" }}>
              <label>Dil əlavə et</label>
              <input
                ref={langInputRef}
                type="text"
                value={langInput}
                onChange={handleLangInputChange}
                onBlur={() => setTimeout(() => setLangSuggestions([]), 150)}
                placeholder='Məs: "azer", "rus", "ing"...'
                className={styles.input}
                autoComplete="off"
              />
              {langSuggestions.length > 0 && (
                <div className={styles.suggestionList}>
                  {langSuggestions.map(lang => (
                    <div key={lang.code} className={styles.suggestionItem}
                      onMouseDown={() => handleSelectSuggestion(lang)}>
                      <span className={styles.suggestionFlag}>{lang.emoji || lang.flag}</span>
                      <span>{lang.name}</span>
                      <span className={styles.suggestionCode}>{lang.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.buttonsWrapper}>
              <button type="submit" className={styles.button}
                style={{ background: selectedLang ? "#0077ff" : "#aaa" }}
                disabled={!selectedLang || langLoader}>
                {langLoader ? <CircularProgress size={20} style={{ color: "#fff" }} /> : <><AddIcon /> Əlavə et</>}
              </button>
            </div>
          </form>
        )}

        {/* Global admin: pending requests (only true global admins approve) */}
        {!isNonMain && (
          <div className={styles.requestSection}>
            <h3 className={styles.sectionTitle}>
              Gözləyən Sorğular
              {requests.length > 0 && <span className={styles.countBadge}>{requests.length}</span>}
            </h3>
            {requestsLoading ? (
              <div className={styles.centerRow}><CircularProgress size={24} /></div>
            ) : requests.length === 0 ? (
              <p className={styles.emptyText}>Gözləyən sorğu yoxdur</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bayraq</th>
                    <th>Kod</th>
                    <th>Ad</th>
                    <th>Müəssisə</th>
                    <th>Tarix</th>
                    <th>Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>
                        {req.flag
                          ? <span className={`fi fi-${req.flag}`} style={{ fontSize: "20px", borderRadius: "3px" }} />
                          : "—"}
                      </td>
                      <td><code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px" }}>{req.code}</code></td>
                      <td><strong>{req.name}</strong></td>
                      <td>{req.institution_name || "—"}</td>
                      <td>{req.created_at?.split("T")[0]}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className={styles.approveBtn} onClick={() => handleApprove(req.id)} title="Təsdiqlə">
                            <CheckIcon fontSize="small" />
                          </button>
                          <button className={styles.rejectBtn} onClick={() => handleReject(req.id)} title="Rədd et">
                            <CloseIcon fontSize="small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Languages table */}
        <div style={{ marginTop: "24px" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bayraq</th>
                <th>Kod</th>
                <th>Ad</th>
                {canDirect && <th>Əməliyyat</th>}
              </tr>
            </thead>
            <tbody>
              {languages.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "#888" }}>Dil yoxdur</td></tr>
              ) : languages.map(lang => (
                <tr key={lang.id}>
                  <td>
                    {lang.flag
                      ? <span className={`fi fi-${lang.flag}`} style={{ fontSize: "22px", borderRadius: "3px" }} />
                      : "—"}
                  </td>
                  <td><code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px" }}>{lang.code}</code></td>
                  <td>{lang.name}</td>
                  {canDirect && (
                    <td>
                      <button className={styles.button}
                        style={{ background: "#d64545", width: "auto", padding: "7px 11px" }}
                        onClick={() => handleDeleteLanguage(lang.id, lang.name)} title="Sil">
                        <DeleteIcon fontSize="small" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Non-main admin: own requests list */}
        {isNonMain && languagePermission === 'request' && (
          <div className={styles.requestSection}>
            <h3 className={styles.sectionTitle}>Sorğularım</h3>
            {requestsLoading ? (
              <div className={styles.centerRow}><CircularProgress size={24} /></div>
            ) : requests.length === 0 ? (
              <p className={styles.emptyText}>Hələ sorğu yoxdur</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Bayraq</th>
                    <th>Kod</th>
                    <th>Ad</th>
                    <th>Status</th>
                    <th>Tarix</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>
                        {req.flag
                          ? <span className={`fi fi-${req.flag}`} style={{ fontSize: "20px", borderRadius: "3px" }} />
                          : "—"}
                      </td>
                      <td><code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px" }}>{req.code}</code></td>
                      <td>{req.name}</td>
                      <td>
                        <span className={
                          req.status === "pending" ? styles.badgePending
                          : req.status === "approved" ? styles.badgeApproved
                          : styles.badgeRejected
                        }>
                          {req.status === "pending" ? "Gözləyir"
                            : req.status === "approved" ? "Təsdiqləndi"
                            : "Rədd edildi"}
                        </span>
                      </td>
                      <td>{req.created_at?.split("T")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLanguagesPage;
