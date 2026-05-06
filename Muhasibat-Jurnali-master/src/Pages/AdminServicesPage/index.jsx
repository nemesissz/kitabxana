import styles from "./index.module.scss";
import DeleteIcon from "@mui/icons-material/Delete";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import Swal from "sweetalert2";

function AdminServicesPage() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_active: true,
  });

  // Admin yoxlaması
  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) {
      store.admin.setData(null);
      navigate("/admin/login");
    } else {
      axios
        .get(`${Base_Url_Server}users/${adminID}`, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        })
        .then((res) => store.admin.setData(res.data.data.user))
        .catch(() => {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
          navigate("/admin/login");
        });
    }
  }, []);

  // Servisləri çək
  const fetchServices = () => {
    store.loader.setData(true);
    axios.get(`${Base_Url_Server}services`).then((res) => {
      const data = res.data.data.services;
      setServices(data);
      setFilteredServices(data);
    }).finally(() => {
      store.loader.setData(false);
    });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Axtarış funksiyası
  const handleSearch = (value) => {
    setSearchValue(value);
    const filtered = services.filter(
      (service) =>
        service.name.toLowerCase().includes(value.toLowerCase()) ||
        service.description.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredServices(filtered);
  };

  // Silmə funksiyası
  const handleDelete = (id) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    Swal.fire({
      title: "Əminsən?",
      text: "Bu servisi silmək istədiyindən əminsən?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#2c3e50",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${Base_Url_Server}services/${id}`, {
            headers: {
              Authorization: `Bearer ${tokenAdmin}`,
              "Content-Type": "application/json",
            },
          })
          .then(() => {
            Swal.fire("Silindi!", "Servis uğurla silindi.", "success");
            fetchServices();
          })
          .catch(() => {
            Swal.fire("Xəta!", "Servis silinmədi.", "error");
          });
      }
    });
  };

  // Redaktə formu açmaq
  const handleEdit = (service) => {
    setEditingService(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      is_active: service.is_active,
    });
  };

  // Yeniləmə funksiyası
  const handleUpdate = (e) => {
    e.preventDefault();
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    axios
      .put(
        `${Base_Url_Server}services/${editingService}`,
        formData,
        { headers: { Authorization: `Bearer ${tokenAdmin}` } }
      )
      .then(() => {
        Swal.fire("Uğurlu!", "Servis məlumatları yeniləndi.", "success");
        setEditingService(null);
        fetchServices();
      })
      .catch(() => Swal.fire("Xəta!", "Yeniləmə alınmadı.", "error"));
  };

  return (
    <div className={styles.adminServices}>
      <div className={styles.header}>
        <h3>Servisləri idarə et</h3>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Axtar..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <button onClick={() => navigate("/admin/add-service")}>
          <AddCircleOutlineIcon /> Əlavə et
        </button>
      </div>

      {/* Redaktə formu */}
      <form
        style={editingService ? {} : { maxHeight: "0", padding: "0" }}
        className={styles.form}
        onSubmit={handleUpdate}
      >
        <h4>Servisi redaktə et</h4>
        <div className={styles.inputGroup}>
          <label>Başlıq</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Servis Haqqında</label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          ></textarea>
        </div>
        <div className={styles.inputGroup}>
          <label>Qiymət</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Aktivlik</label>
          <select
            value={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.value === "true" })
            }
          >
            <option value="true">Bəli</option>
            <option value="false">Xeyr</option>
          </select>
        </div>
        <div className={styles.buttonsWrapper}>
          <button type="submit">Yenilə</button>
          <button
            type="button"
            onClick={() => setEditingService(null)}
            className={styles.cancelBtn}
          >
            Ləğv et
          </button>
        </div>
      </form>

      {/* Servislər cədvəli */}
      <div className={styles.serviceList}>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Başlıq</th>
              <th>Servis Haqqında</th>
              <th>Qiymət</th>
              <th>Aktiv</th>
              <th>Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.map((service, i) => (
              <tr key={service.id}>
                <td>{i + 1}</td>
                <td className={styles.title}>{service.name}</td>
                <td className={styles.content}>{service.description}</td>
                <td>{service.price}</td>
                <td>{service.is_active ? "Bəli" : "Xeyr"}</td>
                <td>
                  <Tooltip title="Redaktə et" placement="top">
                    <button onClick={() => handleEdit(service)}>
                      <EditDocumentIcon />
                    </button>
                  </Tooltip>
                  <Tooltip title="Sil" placement="top">
                    <button onClick={() => handleDelete(service.id)}>
                      <DeleteIcon />
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminServicesPage;
