import React, { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import bg from "./../../Assets/heroImage.jpg";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import { useNavigate } from "react-router-dom"; // 🔹 Navigate üçün əlavə edildi

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loader, setLoader] = useState(false);
  const store = useContext(dataContext);
  const navigate = useNavigate(); // 🔹 Router istifadə olunur
  const [pass, setPass] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userID = localStorage.getItem("user");
    if (!token || !userID) {
      store.user.setData(null);
    } else {
      axios
        .get(Base_Url_Server + "users/" + userID, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  const formReset = () => {
    setForm({ email: "", password: "" });
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
          formReset();
          alert("Account not found");
        } else {
          localStorage.setItem("token", response.data.data.token);
          localStorage.setItem(
            "user",
            JSON.stringify(response.data.data.user.id)
          );
          store.user.setData(response.data.data.user);
          formReset();
          window.location.href = "/";
        }
      })
      .catch((error) => {
        setLoader(false);
        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
      });
  };

  return (
    <div className={styles.container}>
      <img src={bg} alt="" />
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Daxil ol</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className={styles.input}
          required
        />
        <div className={styles.inputGroup}>
          <input
            type={pass ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <RemoveRedEyeIcon
            className={styles.eyeIcon}
            style={pass ? { color: "#032062" } : {}}
            onClick={() => {
              setPass(!pass);
            }}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.button}>
          {loader ? "Yüklənir..." : "Daxil ol"}
        </button>

        {/* 🔹 Yeni hissə: Register səhifəsinə keçid düyməsi */}
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
