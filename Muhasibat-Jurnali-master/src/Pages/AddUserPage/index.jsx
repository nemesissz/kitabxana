import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import { useNavigate } from "react-router-dom";
import dataContext from "../../Contexts/GlobalState";
import Swal from "sweetalert2";

function AddUserPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) {
      store.admin.setData(null);
      Swal.fire({
        title: "Giriş tələb olunur",
        text: "Admin hesabı ilə daxil olun!",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/admin/login");
      });
    } else {
      axios
        .get(Base_Url_Server + "users/" + adminID, {
          headers: {
            Authorization: `Bearer ${tokenAdmin}`,
          },
        })
        .then((response) => {
          store.admin.setData(response.data.data.user);
        })
        .catch(() => {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
          Swal.fire({
            title: "Giriş xətası",
            text: "Token etibarsızdır, yenidən daxil olun!",
            icon: "error",
            confirmButtonText: "OK",
          }).then(() => {
            navigate("/admin/login");
          });
        });
    }
  }, []);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    subscription: "none",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password) {
      Swal.fire({
        title: "Xəta ❌",
        text: "Bütün xanaları doldurun!",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      setLoading(true);
      const tokenAdmin = localStorage.getItem("tokenAdmin");

      await axios.post(Base_Url_Server + "users", formData, {
        headers: {
          Authorization: `Bearer ${tokenAdmin}`,
          "Content-Type": "application/json",
        },
      });

      setLoading(false);

      Swal.fire({
        title: "Uğur ✅",
        text: "İstifadəçi uğurla əlavə olundu!",
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        setFormData({
          username: "",
          email: "",
          password: "",
          role: "user",
          subscription: "none",
        });
      });
    } catch (err) {
      setLoading(false);
      Swal.fire({
        title: "Xəta ❌",
        text: err.response?.data?.message || "İstifadəçi əlavə olunmadı!",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className={styles.addUserPage}>
      <div className={styles.addUser}>
        <h2>Yeni İstifadəçi Əlavə Et</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>İstifadəçi Adı</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Şifrə</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Rol</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Abunəlik</label>
            <select
              name="subscription"
              value={formData.subscription}
              onChange={handleChange}
            >
              <option value="none">None</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Əlavə olunur..." : "Əlavə Et"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddUserPage;
