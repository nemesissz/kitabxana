import React, { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import bg from "./../../Assets/heroImage.jpg";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loader, setLoader] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const store = useContext(dataContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      store.user.setData(null);
    } else {
      axios
        .get(Base_Url_Server + "users/" + userID, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          store.user.setData(response.data.data.user);
          navigate("/profile");
        })
        .catch(() => {
          store.user.setData(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        });
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoader(true);
    axios
      .post(Base_Url_Server + "auth/login", form)
      .then((response) => {
        setLoader(false);
        if (response.data.data.user.role !== 1) {
          setError("Bu hesab tapılmadı.");
        } else {
          localStorage.setItem("token", response.data.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.data.user.id));
          store.user.setData(response.data.data.user);
          window.location.href = "/";
        }
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
          <h2>Xoş gəldiniz</h2>
          <p>Hesabınıza daxil olmaq üçün məlumatlarınızı daxil edin</p>
        </div>

        {/* Email */}
        <div className={styles.fieldGroup}>
          <div className={`${styles.inputGroup} ${error ? styles.hasError : ""}`}>
            <EmailOutlinedIcon className={styles.fieldIcon} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
        </div>

        {/* Şifrə */}
        <div className={styles.fieldGroup}>
          <div className={`${styles.inputGroup} ${error ? styles.hasError : ""}`}>
            <LockOutlinedIcon className={styles.fieldIcon} />
            <input
              type={showPass ? "text" : "password"}
              name="password"
              placeholder="Şifrə"
              value={form.password}
              onChange={handleChange}
              className={styles.input}
              required
            />
            <RemoveRedEyeIcon
              className={styles.eyeIcon}
              style={showPass ? { color: "#032062" } : {}}
              onClick={() => setShowPass(!showPass)}
            />
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.button} disabled={loader}>
          {loader ? "Yüklənir..." : "Daxil ol"}
        </button>

        <p className={styles.registerText}>
          Hesabınız yoxdur?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className={styles.registerBtn}
          >
            Qeydiyyat
          </button>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
