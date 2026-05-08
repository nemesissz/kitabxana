import React, { useState, useContext } from "react";
import styles from "./index.module.scss";
import bg from "./../../Assets/heroImage.jpg";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const RegisterPage = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const store = useContext(dataContext);
  const [loader, setLoader] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  const validate = () => {
    const errors = {};
    if (!form.fullName.trim()) errors.fullName = "Ad Soyad tələb olunur";
    if (!form.email.trim()) errors.email = "Email tələb olunur";
    if (form.password.length < 6) errors.password = "Şifrə minimum 6 simvol olmalıdır";
    if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Şifrələr uyğun gəlmir";
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoader(true);
    axios
      .post(Base_Url_Server + "auth/register", {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      .then((response) => {
        setLoader(false);
        const { user, token } = response.data.data;
        if (!user || !token) {
          setError("Qeydiyyat uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.");
          return;
        }
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user.id));
        store.user.setData(user);
        navigate("/");
      })
      .catch((error) => {
        setLoader(false);
        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else {
          setError("Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.");
        }
      });
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

        {/* Email */}
        <div className={styles.fieldGroup}>
          <div className={`${styles.inputGroup} ${fieldErrors.email ? styles.hasError : ""}`}>
            <EmailOutlinedIcon className={styles.fieldIcon} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
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
