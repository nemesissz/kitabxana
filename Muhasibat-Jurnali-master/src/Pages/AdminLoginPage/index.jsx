import React, { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";

const AdminLoginPage = () => {
  const [pass, setPass] = useState(false);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const store = useContext(dataContext);
  const navigate = useNavigate(); // Router istifadə olunur
  // formReset funksiyası əskik idi
  const formReset = () => {
    setForm({ email: "", password: "" });
    setError("");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) {
      store.admin.setData(null);
    } else {
      axios
        .get(Base_Url_Server + "users/" + adminID, {
          headers: {
            Authorization: `Bearer ${tokenAdmin}`,
          },
        })
        .then((response) => {
          store.admin.setData(response.data.data.user);
          navigate("/admin");
        })
        .catch(() => {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
        });
    }
  }, []);
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    axios
      .post(Base_Url_Server + "auth/login/admin", form)
      .then((response) => {
        setLoading(false);
        console.log(response.data.data.user.role);
        if (response.data.data.user.role == 1) {
          setError("Account not found");
        } else {
          localStorage.setItem("tokenAdmin", response.data.data.token);
          localStorage.setItem(
            "admin",
            JSON.stringify(response.data.data.user.id)
          );
          store.admin.setData(response.data.data.user);
          formReset();
          window.location.href = "/admin";
        }
      })
      .catch((error) => {
        setLoading(false);
        // clg funksiyası əskik idi, onu console.log ilə əvəz etdim
        console.log("error", error);
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          setError(error.response.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
      });
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Mühasibat Jurnalı</h2>
        <div className={styles.inputGroup}>
          <input
            placeholder="İstifadəçi adı"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.inputGroup}>
          <input
            placeholder="Şifrə"
            type={pass ? "text" : "password"}
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className={styles.input}
          />
          <RemoveRedEyeIcon
            className={styles.eyeIcon}
            style={pass ? { color: "#032062" } : {}}
            onClick={() => setPass(!pass)}
          />
        </div>
        {/* Error mesajı göstərilməsi əskik idi */}
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" className={styles.button}>
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Daxil ol"
          )}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
