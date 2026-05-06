import React, { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import dataContext from "../../Contexts/GlobalState";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate } from "react-router-dom";

const AdminProfilPage = () => {
  const store = useContext(dataContext);
  const user = store?.admin?.data;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    role: "",
    plan: "",
    status: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) {
      store.admin.setData(null);
      navigate("/admin/login");
    } else {
      axios
        .get(Base_Url_Server + "users/" + adminID, {
          headers: {
            Authorization: `Bearer ${tokenAdmin}`,
          },
        })
        .then((response) => {
          store.admin.setData(response.data.data.user);
          console.log(response.data.data.user);
        })
        .catch(() => {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
          navigate("/admin/login");
        });
    }
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        role: user.role || "",
        plan: user.subscriptions?.[0]?.plan || "",
        status: user.subscriptions?.[0]?.status || "",
      });
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("tokenAdmin");
    localStorage.removeItem("admin");
    store.admin.setData(null);
    navigate("/admin/login");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      return setMessage("Bütün xanaları doldurun ❗");
    }
    if (newPassword !== confirmPassword) {
      return setMessage("Yeni şifrələr uyğun gəlmir ❌");
    }

    try {
      // Server tərəfdə oldPassword yoxlanışı olmalıdır
      await axios.patch(
        `${Base_Url_Server}users/${user.id}`,
        {
          password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("tokenAdmin")}`,
          },
        }
      );
      setMessage("Şifrə uğurla dəyişdirildi 🔒");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error) {
      console.error(error);
      setMessage("Şifrə dəyişdirilə bilmədi ❌");
    }
  };

  if (!user) return <p style={{ padding: "20px" }}>Yüklənir...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h2 className={styles.title}>Mənim profilim</h2>

        <div className={styles.inputsWrapper}>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input
              className={styles.input}
              type="email"
              value={form.email}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Rol</label>
            <input
              className={styles.input}
              type="text"
              value={
                form.role == 3
                  ? "Super Admin"
                  : form.role == 2
                  ? "Admin"
                  : "User"
              }
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Plan</label>
            <input
              className={styles.input}
              type="text"
              value={form.plan === "none" ? "Yoxdur" : form.plan}
              readOnly
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Status</label>
            <input
              className={styles.input}
              type="text"
              value={user.isVerified ? "Aktiv" : "Deaktiv"}
              readOnly
            />
          </div>
        </div>

        <div className={styles.buttonsWrapper}>
          <button
            type="button"
            className={styles.button}
            style={{ background: "#28a745" }}
            onClick={() => setShowPasswordForm((prev) => !prev)}
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
            <button
              type="submit"
              className={styles.button}
              style={{ background: "#28a745" }}
            >
              Yenilə
            </button>
          </form>
        )}

        {message && (
          <p style={{ textAlign: "center", color: "#333", marginTop: "10px" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminProfilPage;
