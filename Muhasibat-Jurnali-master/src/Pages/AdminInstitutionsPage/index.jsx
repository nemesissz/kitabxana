import { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import dataContext from "../../Contexts/GlobalState";
import Base_Url_Server, { formatServerFilePath } from "../../Constants/baseUrl";

function AdminInstitutionsPage() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", logo: null, logoPreview: null });

  // Auth + superadmin check
  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { navigate("/admin/login"); return; }
    axios.get(`${Base_Url_Server}users/${adminID}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })
      .then((res) => {
        const user = res.data.data.user;
        store.admin.setData(user);
        if (user.role < 4) { navigate("/admin"); }
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
          navigate("/admin/login");
        }
      });
  }, []);

  const fetchInstitutions = () => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    setLoading(true);
    axios.get(`${Base_Url_Server}institutions`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    })
      .then((res) => setInstitutions(res.data.data.institutions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInstitutions(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: "", logo: null, logoPreview: null, isMain: false });
    setShowModal(true);
  };

  const openEdit = (inst) => {
    setEditingId(inst.id);
    setFormData({ name: inst.name, logo: null, logoPreview: inst.logo_path ? formatServerFilePath(inst.logo_path) : null, isMain: !!inst.is_main });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingId(null); };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, logo: file, logoPreview: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return Swal.fire("Xəta", "Müəssisə adı boş ola bilməz", "error");
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const fd = new FormData();
    fd.append("name", formData.name.trim());
    if (formData.logo) fd.append("logo", formData.logo);
    if (editingId) fd.append("is_main", formData.isMain ? "true" : "false");
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${Base_Url_Server}institutions/${editingId}`, fd, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        });
      } else {
        await axios.post(`${Base_Url_Server}institutions`, fd, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        });
      }
      closeModal();
      fetchInstitutions();
    } catch (err) {
      Swal.fire("Xəta", err.response?.data?.message || "Əməliyyat uğursuz oldu", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, name) => {
    Swal.fire({
      title: "Əminsən?",
      text: `"${name}" müəssisəsini silmək istədiyindən əminsən?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#2c3e50",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    }).then((result) => {
      if (!result.isConfirmed) return;
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      axios.delete(`${Base_Url_Server}institutions/${id}`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      })
        .then(() => { Swal.fire("Silindi!", "Müəssisə uğurla silindi.", "success"); fetchInstitutions(); })
        .catch(() => Swal.fire("Xəta!", "Silinmə uğursuz oldu.", "error"));
    });
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h3>Müəssisələr</h3>
        <button onClick={openCreate}>
          <AddCircleOutlineIcon /> Müəssisə əlavə et
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loaderWrap}><CircularProgress /></div>
        ) : institutions.length === 0 ? (
          <div className={styles.empty}>
            <BusinessIcon style={{ fontSize: 48, color: "#ccc" }} />
            <p>Hələ heç bir müəssisə yoxdur</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Logo</th>
                <th>Ad</th>
                <th>Üzv sayı</th>
                <th>Status</th>
                <th>Tarix</th>
                <th>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst, i) => (
                <tr key={inst.id}>
                  <td>{i + 1}</td>
                  <td>
                    {inst.logo_path ? (
                      <img
                        src={formatServerFilePath(inst.logo_path)}
                        alt={inst.name}
                        className={styles.logoThumb}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className={styles.noLogo}><BusinessIcon /></div>
                    )}
                  </td>
                  <td className={styles.nameCell}>
                    {inst.name}
                    {!!inst.is_main && <span className={styles.mainBadge}>Əsas</span>}
                  </td>
                  <td>{inst.member_count}</td>
                  <td>
                    <span className={inst.is_active ? styles.active : styles.inactive}>
                      {inst.is_active ? "Aktiv" : "Deaktiv"}
                    </span>
                  </td>
                  <td>{inst.created_at ? new Date(inst.created_at).toLocaleDateString("az-AZ") : "—"}</td>
                  <td>
                    <Tooltip title="Redaktə et" placement="top">
                      <button className={styles.editBtn} onClick={() => openEdit(inst)}>
                        <EditDocumentIcon />
                      </button>
                    </Tooltip>
                    <Tooltip title="Sil" placement="top">
                      <button className={styles.deleteBtn} onClick={() => handleDelete(inst.id, inst.name)}>
                        <DeleteIcon />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>{editingId ? "Müəssisəni redaktə et" : "Yeni müəssisə"}</h4>
              <button className={styles.closeBtn} onClick={closeModal}><CloseIcon /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label>Müəssisə adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Müəssisənin adını daxil edin"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Logo (isteğe bağlı)</label>
                <div className={styles.logoUpload}>
                  {formData.logoPreview ? (
                    <img src={formData.logoPreview} alt="Logo" className={styles.logoPreview} />
                  ) : (
                    <div className={styles.logoPlaceholder}><BusinessIcon style={{ fontSize: 40, color: "#ccc" }} /></div>
                  )}
                  <label className={styles.uploadBtn} htmlFor="logoInput">
                    {formData.logoPreview ? "Dəyiş" : "Şəkil seç"}
                  </label>
                  <input
                    id="logoInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              {editingId && (
                <div className={styles.checkRow}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!formData.isMain}
                      onChange={(e) => setFormData((p) => ({ ...p, isMain: e.target.checked }))}
                    />
                    <span>Əsas müəssisə kimi təyin et</span>
                  </label>
                </div>
              )}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Ləğv et</button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>
                  {saving ? <CircularProgress size={18} style={{ color: "#fff" }} /> : (editingId ? "Yadda saxla" : "Yarat")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInstitutionsPage;
