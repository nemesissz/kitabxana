import React, { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate } from "react-router-dom";
import { ROLE_LABELS } from "../../Constants/roles";

const AdminProfilPage = () => {
  const store = useContext(dataContext);
  const user = store?.admin?.data;
  const navigate = useNavigate();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  const [newLogin, setNewLogin] = useState("");
  const [loginMsg, setLoginMsg] = useState("");

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) {
      store.admin.setData(null);
      navigate("/admin/login");
    } else {
      axios
        .get(Base_Url_Server + "users/" + adminID, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        })
        .then((response) => {
          store.admin.setData(response.data.data.user);
        })
        .catch((error) => {
          if (error.response?.status === 401) {
            store.admin.setData(null);
            localStorage.removeItem("tokenAdmin");
            localStorage.removeItem("admin");
            navigate("/admin/login");
          }
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tokenAdmin");
    localStorage.removeItem("admin");
    store.admin.setData(null);
    navigate("/admin/login");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      return setPasswordMsg("Bütün xanaları doldurun");
    }
    if (newPassword !== confirmPassword) {
      return setPasswordMsg("Yeni şifrələr uyğun gəlmir");
    }
    try {
      await axios.patch(
        `${Base_Url_Server}users/${user.id}`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem("tokenAdmin")}` } }
      );
      setPasswordMsg("Şifrə uğurla dəyişdirildi");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error) {
      setPasswordMsg(error.response?.data?.message || "Şifrə dəyişdirilə bilmədi");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginMsg("");
    if (!newLogin.trim() || newLogin.trim().length < 3) {
      return setLoginMsg("İstifadəçi adı minimum 3 simvol olmalıdır");
    }
    try {
      const res = await axios.patch(
        `${Base_Url_Server}users/${user.id}`,
        { login: newLogin.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("tokenAdmin")}` } }
      );
      store.admin.setData(res.data.data.user);
      setLoginMsg("İstifadəçi adı uğurla dəyişdirildi");
      setNewLogin("");
      setShowLoginForm(false);
    } catch (error) {
      setLoginMsg(error.response?.data?.message || "Dəyişdirilə bilmədi");
    }
  };

  if (!user) return <p style={{ padding: "20px" }}>Yüklənir...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h2 className={styles.title}>Mənim profilim</h2>

        <div className={styles.inputsWrapper}>
          <div className={styles.inputGroup}>
            <label>İstifadəçi adı</label>
            <input
              className={styles.input}
              type="text"
              value={user.login || "—"}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Rol</label>
            <input
              className={styles.input}
              type="text"
              value={ROLE_LABELS[user.role] || "—"}
              readOnly
            />
          </div>
        </div>

        <div className={styles.buttonsWrapper}>
          <button
            type="button"
            className={styles.button}
            style={{ background: "#1565c0" }}
            onClick={() => { setShowLoginForm(v => !v); setLoginMsg(""); }}
          >
            {showLoginForm ? "Bağla" : "İstifadəçi adını dəyiş"}
          </button>
          <button
            type="button"
            className={styles.button}
            style={{ background: "#28a745" }}
            onClick={() => { setShowPasswordForm(v => !v); setPasswordMsg(""); }}
          >
            {showPasswordForm ? "Şifrə Formunu Bağla" : "Şifrəni Dəyiş"}
          </button>
          <button
            type="button"
            className={styles.button}
            style={{ background: "#d64545" }}
            onClick={handleLogout}
          >
            Hesabdan çıxış
          </button>
        </div>

        {/* İstifadəçi adı dəyiş formu */}
        {showLoginForm && (
          <form onSubmit={handleLoginSubmit} className={styles.passwordForm}>
            <div className={styles.inputGroup}>
              <label>Yeni istifadəçi adı</label>
              <input
                type="text"
                value={newLogin}
                onChange={(e) => setNewLogin(e.target.value)}
                placeholder="Yeni istifadəçi adını yazın..."
                className={styles.input}
              />
            </div>
            {loginMsg && (
              <p style={{ textAlign: "center", color: loginMsg.includes("uğurla") ? "green" : "#d64545", marginTop: "6px" }}>
                {loginMsg}
              </p>
            )}
            <button type="submit" className={styles.button} style={{ background: "#1565c0" }}>
              Yadda saxla
            </button>
          </form>
        )}

        {/* Şifrə dəyiş formu */}
        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
            <div className={styles.inputGroup}>
              <label>Köhnə Şifrə</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Köhnə şifrəni yazın..."
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Yeni Şifrə</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifrəni yazın..."
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Şifrəni Təsdiqlə</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Təsdiqləyin..."
                className={styles.input}
              />
            </div>
            {passwordMsg && (
              <p style={{ textAlign: "center", color: passwordMsg.includes("uğurla") ? "green" : "#d64545", marginTop: "6px" }}>
                {passwordMsg}
              </p>
            )}
            <button type="submit" className={styles.button} style={{ background: "#28a745" }}>
              Yenilə
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminProfilPage;
