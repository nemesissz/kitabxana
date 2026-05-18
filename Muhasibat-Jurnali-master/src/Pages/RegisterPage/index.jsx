import React, { useState, useContext, useEffect } from "react";
import styles from "./index.module.scss";
import bg from "./../../Assets/heroImage.jpg";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BusinessIcon from "@mui/icons-material/Business";

const RegisterPage = () => {
  const [form, setForm] = useState({
    fullName: "",
    login: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const store = useContext(dataContext);
  const [loader, setLoader] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(Base_Url_Server + "institutions/public")
      .then((r) => setInstitutions(r.data.data.institutions || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  const validate = () => {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "Ad Soyad tələb olunur";
    if (!form.login.trim()) errors.login = "İstifadəçi adı tələb olunur";
    if (form.login.trim().length < 3) errors.login = "İstifadəçi adı minimum 3 simvol olmalıdır";
    if (form.password.length < 6) errors.password = "Şifrə minimum 6 simvol olmalıdır";
    if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Şifrələr uyğun gəlmir";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoader(true);
    try {
      const response = await axios.post(Base_Url_Server + "auth/register", {
        fullName: form.fullName.trim(),
        login: form.login.trim(),
        password: form.password,
      });

      const { user, token } = response.data.data;
      if (!user || !token) { setError("Qeydiyyat uğursuz oldu."); setLoader(false); return; }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user.id));
      store.user.setData(user);

      if (selectedInstitution) {
        try {
          await axios.post(
            `${Base_Url_Server}institutions/${selectedInstitution}/join-request`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch {
          // sorğu göndərilməsə də qeydiyyat uğurludur
        }
      }

      navigate("/");
    } catch (err) {
      setLoader(false);
      setError(err.response?.data?.message || "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.");
    }
  };

  return (
    <div className={styles.container}>
      <img src={bg} alt="" />
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formHeader}>
          <h2>Qeydiyyat</h2>
          <p>Hesab yaratmaq üçün məlumatlarınızı daxil edin</p>
        </div>

        {/* Ad Soyad */}
        <div className={styles.fieldGroup}>
          <div className={`${styles.inputGroup} ${fieldErrors.fullName ? styles.hasError : ""}`}>
            <PersonOutlineIcon className={styles.fieldIcon} />
            <input
              type="text"
              name="fullName"
              placeholder="Ad Soyad"
              value={form.fullName}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          {fieldErrors.fullName && <span className={styles.fieldError}>{fieldErrors.fullName}</span>}
        </div>

        {/* İstifadəçi adı */}
        <div className={styles.fieldGroup}>
          <div className={`${styles.inputGroup} ${fieldErrors.login ? styles.hasError : ""}`}>
            <PersonOutlineIcon className={styles.fieldIcon} />
            <input
              type="text"
              name="login"
              placeholder="İstifadəçi adı"
              value={form.login}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          {fieldErrors.login && <span className={styles.fieldError}>{fieldErrors.login}</span>}
        </div>

        {/* Şifrə */}
        <div className={styles.fieldGroup}>
          <div className={`${styles.inputGroup} ${fieldErrors.password ? styles.hasError : ""}`}>
            <LockOutlinedIcon className={styles.fieldIcon} />
            <input
              type={showPass ? "text" : "password"}
              name="password"
              placeholder="Şifrə"
              value={form.password}
              onChange={handleChange}
              className={styles.input}
            />
            <RemoveRedEyeIcon
              className={styles.eyeIcon}
              style={showPass ? { color: "#032062" } : {}}
              onClick={() => setShowPass(!showPass)}
            />
          </div>
          {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
        </div>

        {/* Şifrəni təsdiqlə */}
        <div className={styles.fieldGroup}>
          <div className={`${styles.inputGroup} ${fieldErrors.confirmPassword ? styles.hasError : ""}`}>
            <LockOutlinedIcon className={styles.fieldIcon} />
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              placeholder="Şifrəni təsdiqlə"
              value={form.confirmPassword}
              onChange={handleChange}
              className={styles.input}
            />
            <RemoveRedEyeIcon
              className={styles.eyeIcon}
              style={showConfirm ? { color: "#032062" } : {}}
              onClick={() => setShowConfirm(!showConfirm)}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <span className={styles.fieldError}>{fieldErrors.confirmPassword}</span>
          )}
        </div>

        {/* Müəssisə üzvlüyü — optional */}
        {institutions.length > 0 && (
          <div className={styles.institutionSection}>
            <div className={styles.institutionLabel}>
              <BusinessIcon style={{ fontSize: 16, marginRight: 6, color: "#6a1b9a" }} />
              Müəssisə üzvlüyü üçün sorğu göndər
              <span className={styles.optionalTag}>optional</span>
            </div>
            <div className={styles.inputGroup}>
              <select
                className={styles.institutionSelect}
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
              >
                <option value="">— Seçin (istəyə bağlı) —</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
            {selectedInstitution && (
              <p className={styles.institutionHint}>
                Qeydiyyatdan sonra seçdiyiniz müəssisənin admininə üzvlük sorğusu göndəriləcək.
              </p>
            )}
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.button} disabled={loader}>
          {loader ? "Yüklənir..." : "Hesab yarat"}
        </button>

        <p className={styles.registerText}>
          Artıq hesabınız var?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className={styles.registerBtn}
          >
            Daxil ol
          </button>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
