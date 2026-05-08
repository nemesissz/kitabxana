import { useContext, useEffect, useState, useRef, useCallback } from "react";
import styles from "./index.module.scss";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";

const PERMISSION_LABELS = {
  none:    { label: "İzləyici",        color: "#888",    bg: "#f0f0f0" },
  pending: { label: "Gözləmə ilə",     color: "#b07d00", bg: "#fff8e1" },
  free:    { label: "Sərbəst",         color: "#1a7a3a", bg: "#e8f8ee" },
};

const ROLE_LABELS = { 1: "İstifadəçi", 2: "Admin", 3: "Super Admin" };

function AdminUsersPage() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPermission, setFilterPermission] = useState("");
  const debounceRef = useRef(null);

  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({ password: "", role: 1, upload_permission: "none" });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { navigate("/admin/login"); return; }
    axios.get(Base_Url_Server + "users/" + adminID, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then((r) => store.admin.setData(r.data.data.user))
      .catch(() => navigate("/admin/login"));
  }, []);

  const fetchUsers = useCallback(async () => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      const res = await axios.get(Base_Url_Server + "users", {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setUsers(res.data.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase());
    const matchPerm = !filterPermission || u.uploadPermission === filterPermission;
    return matchSearch && matchPerm;
  });

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "İstifadəçini silmək istədiyinizdən əminsiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    });
    if (!result.isConfirmed) return;
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.delete(`${Base_Url_Server}users/${id}`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      Swal.fire({ icon: "success", title: "Silindi!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Silinə bilmədi", "error");
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditData({
      password: "",
      role: user.role,
      upload_permission: user.uploadPermission || "none",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    setEditLoading(true);
    const payload = { role: editData.role, upload_permission: editData.upload_permission };
    if (editData.password.trim()) payload.password = editData.password;
    try {
      await axios.patch(`${Base_Url_Server}users/${editingUser.id}`, payload, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      await fetchUsers();
      setEditingUser(null);
      Swal.fire({ icon: "success", title: "Yeniləndi!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Yenilənə bilmədi", "error");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>İstifadəçilər</h2>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Email ilə axtar..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterPermission}
          onChange={(e) => setFilterPermission(e.target.value)}
        >
          <option value="">Bütün icazələr</option>
          <option value="none">İzləyici (icazəsiz)</option>
          <option value="pending">Gözləmə ilə</option>
          <option value="free">Sərbəst</option>
        </select>
      </div>

      <p className={styles.stats}>
        Cəmi <strong>{filteredUsers.length}</strong> istifadəçi
      </p>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.center}><CircularProgress /></div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Rol</th>
                <th>PDF İcazəsi</th>
                <th>Doğrulanmış</th>
                <th>Qeydiyyat tarixi</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const perm = PERMISSION_LABELS[u.uploadPermission || "none"];
                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td className={styles.emailCell}>{u.email}</td>
                    <td>{ROLE_LABELS[u.role] || u.role}</td>
                    <td>
                      <span className={styles.permBadge} style={{ color: perm.color, background: perm.bg }}>
                        {perm.label}
                      </span>
                    </td>
                    <td>{u.isVerified ? "✅" : "❌"}</td>
                    <td>{u.createdAt?.split("T")[0]}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => openEdit(u)} title="Redaktə et">
                          <EditIcon fontSize="small" />
                        </button>
                        <button className={styles.delBtn} onClick={() => handleDelete(u.id)} title="Sil">
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className={styles.modalOverlay} onClick={() => setEditingUser(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>İstifadəçi Redaktə</h3>
              <button className={styles.closeModal} onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <div className={styles.userInfo}>
                <span>{editingUser.email}</span>
              </div>

              <label>PDF Yükləmə İcazəsi</label>
              <select
                value={editData.upload_permission}
                onChange={(e) => setEditData(p => ({ ...p, upload_permission: e.target.value }))}
              >
                <option value="none">İzləyici — PDF yükləyə bilməz</option>
                <option value="pending">Gözləmə ilə — PDF adminə göndərilir</option>
                <option value="free">Sərbəst — PDF birbaşa yayımlanır</option>
              </select>

              <label>Rol</label>
              <select
                value={editData.role}
                onChange={(e) => setEditData(p => ({ ...p, role: Number(e.target.value) }))}
              >
                <option value={1}>İstifadəçi</option>
                <option value={2}>Admin</option>
                <option value={3}>Super Admin</option>
              </select>

              <label>Yeni şifrə (boş buraxılsa dəyişmir)</label>
              <input
                type="password"
                placeholder="Yeni şifrə..."
                value={editData.password}
                onChange={(e) => setEditData(p => ({ ...p, password: e.target.value }))}
              />

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditingUser(null)}>
                  Ləğv et
                </button>
                <button type="submit" className={styles.saveBtn} disabled={editLoading}>
                  {editLoading ? <CircularProgress size={16} style={{ color: "#fff" }} /> : "Yadda saxla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
