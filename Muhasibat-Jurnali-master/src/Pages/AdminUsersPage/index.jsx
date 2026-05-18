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
import { COMBINED_ROLES as ROLES, SUPERADMIN_BADGE, getCombinedRole } from "../../Constants/roles";

function AdminUsersPage() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const debounceRef = useRef(null);

  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({ password: "", combinedRole: 1, institutionId: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");

  const adminInstitutionId = store.admin.data?.institutionId ?? null;
  const adminRole = store.admin.data?.role ?? 0;
  const adminIsMain = institutions.length > 0
    ? institutions.find(i => i.id === adminInstitutionId)?.is_main
    : undefined;
  // Global: superadmin, no institution, or main-institution manager (role>=3)
  const isGlobalScope = adminRole >= 4 || !adminInstitutionId ||
    (institutions.length > 0 && adminIsMain === true && adminRole >= 3);
  // Main institution worker: role=2, main institution
  const isMainWorker = adminRole === 2 && !!adminInstitutionId && adminIsMain === true;
  const canAssignInstitution = adminRole >= 4 || (adminRole === 3 && !!adminIsMain);

  // canEditUser: determines if edit/delete buttons are shown for a target user
  const canEditUser = (u) => {
    if (isGlobalScope) return true;
    if (isMainWorker) {
      // Can edit: no institution OR own (main) institution; NOT external institution members
      return !u.institutionId || u.institutionId === adminInstitutionId;
    }
    // Non-main scope: only own institution members (role < 3)
    return u.institutionId === adminInstitutionId && (u.role ?? 0) < 3;
  };

  const hasOwnInstitution = institutions.length > 0 && adminRole >= 2 && adminRole <= 3 && !!adminInstitutionId && adminIsMain !== undefined;
  const isNonMain = hasOwnInstitution && !adminIsMain;

  const [joinRequests, setJoinRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    const adminID = localStorage.getItem("admin");
    if (!tokenAdmin || !adminID) { navigate("/admin/login"); return; }
    axios.get(Base_Url_Server + "users/" + adminID, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then((r) => store.admin.setData(r.data.data.user))
      .catch(() => navigate("/admin/login"));
  }, []);

  const fetchUsers = useCallback(async (instId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      const params = isGlobalScope && instId ? { institutionId: instId } : {};
      const res = await axios.get(Base_Url_Server + "users", {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        params,
      });
      setUsers(res.data.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isGlobalScope]);

  useEffect(() => { fetchUsers(selectedInstitution); }, [selectedInstitution]);

  useEffect(() => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    axios.get(Base_Url_Server + "institutions", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    }).then((r) => setInstitutions(r.data.data.institutions || [])).catch(() => {});
  }, []);

  const fetchJoinRequests = async (instId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    setRequestsLoading(true);
    try {
      const res = await axios.get(Base_Url_Server + "institutions/join-requests", {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        params: instId ? { institutionId: instId } : {},
      });
      setJoinRequests(res.data.data.requests || []);
    } catch { /* sorğu ola bilməz */ }
    finally { setRequestsLoading(false); }
  };

  useEffect(() => {
    if (hasOwnInstitution) fetchJoinRequests(adminInstitutionId);
  }, [hasOwnInstitution]);

  const filteredUsers = users.filter((u) => {
    const matchSearch = !search || (u.login || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || getCombinedRole(u) === Number(filterRole);
    return matchSearch && matchRole;
  });

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  };

  const handleApproveRequest = async (requestId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.patch(`${Base_Url_Server}institutions/join-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setJoinRequests((p) => p.filter((r) => r.id !== requestId));
      fetchUsers(selectedInstitution);
      Swal.fire({ icon: "success", title: "Təsdiqləndi!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Xəta baş verdi", "error");
    }
  };

  const handleRejectRequest = async (requestId) => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    try {
      await axios.patch(`${Base_Url_Server}institutions/join-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setJoinRequests((p) => p.filter((r) => r.id !== requestId));
      Swal.fire({ icon: "info", title: "Rədd edildi", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Xəta!", err.response?.data?.message || "Xəta baş verdi", "error");
    }
  };

  const handleRefreshRequests = () => fetchJoinRequests(adminInstitutionId);

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
      combinedRole: getCombinedRole(user),
      institutionId: user.institutionId ?? "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    setEditLoading(true);
    const cr = ROLES[editData.combinedRole];
    const payload = { role: cr.role, upload_permission: cr.upload_permission };
    if (editData.password.trim()) payload.password = editData.password;
    payload.institution_id = editData.institutionId ? Number(editData.institutionId) : null;
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

      {/* Müəssisə filteri — yalnız global-scope adminlər üçün */}
      {isGlobalScope && institutions.length > 0 && (
        <div className={styles.institutionFilterBar}>
          <label>Müəssisə:</label>
          <select
            className={styles.filterSelect}
            value={selectedInstitution}
            onChange={(e) => { setSelectedInstitution(e.target.value); setLoading(true); }}
          >
            <option value="">Hamısı</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="text"
            placeholder="İstifadəçi adı ilə axtar..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Bütün rollar</option>
          {Object.entries(ROLES).map(([key, r]) => (
            <option key={key} value={key}>{r.label}</option>
          ))}
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
                <th>İstifadəçi adı</th>
                <th>Rol</th>
                <th>Müəssisə</th>
                <th>Qeydiyyat tarixi</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const cr = u.role >= 4 ? SUPERADMIN_BADGE : ROLES[getCombinedRole(u)];
                const editable = canEditUser(u);
                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td className={styles.emailCell}>{u.login}</td>
                    <td>
                      <span className={styles.permBadge} style={{ color: cr.color, background: cr.bg }}>
                        {cr.label}
                      </span>
                    </td>
                    <td>
                      {u.institutionId
                        ? <span className={styles.instBadge}>{institutions.find(i => i.id === u.institutionId)?.name || `#${u.institutionId}`}</span>
                        : <span className={styles.noInst}>—</span>}
                    </td>
                    <td>{u.createdAt?.split("T")[0]}</td>
                    <td>
                      {editable && (
                        <div className={styles.actions}>
                          <button className={styles.editBtn} onClick={() => openEdit(u)} title="Redaktə et">
                            <EditIcon fontSize="small" />
                          </button>
                          <button className={styles.delBtn} onClick={() => handleDelete(u.id)} title="Sil">
                            <DeleteIcon fontSize="small" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Üzvlük sorğuları — öz müəssisəsi olan işçi/müdiri üçün */}
      {hasOwnInstitution && (
        <div className={styles.requestsSection}>
          <h3 className={styles.requestsTitle}>
            Üzvlük sorğuları
            {joinRequests.length > 0 && (
              <span className={styles.requestsBadge}>{joinRequests.length}</span>
            )}
          </h3>
          {requestsLoading ? (
            <div className={styles.center}><CircularProgress /></div>
          ) : joinRequests.length === 0 ? (
            <p className={styles.noRequests}>Gözləyən sorğu yoxdur</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>İstifadəçi adı</th>
                  <th>Tarix</th>
                  <th>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {joinRequests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.login}</td>
                    <td>{r.created_at?.split("T")[0]}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleApproveRequest(r.id)}
                          title="Təsdiqlə"
                        >
                          ✓ Təsdiqlə
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => handleRejectRequest(r.id)}
                          title="Rədd et"
                        >
                          ✕ Rədd et
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

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
                <span>{editingUser.login}</span>
              </div>

              <label>Rol</label>
              <select
                value={editData.combinedRole}
                onChange={(e) => setEditData(p => ({ ...p, combinedRole: Number(e.target.value) }))}
              >
                {Object.entries(ROLES)
                  .filter(([key]) => adminRole >= 4 || Number(key) < 4)
                  .filter(([key]) => isGlobalScope || Number(key) < 3)
                  .map(([key, r]) => (
                    <option key={key} value={key}>{r.label}</option>
                  ))}
              </select>

              {canAssignInstitution && (
                <>
                  <label>Müəssisə</label>
                  <select
                    value={editData.institutionId}
                    onChange={(e) => setEditData(p => ({ ...p, institutionId: e.target.value }))}
                  >
                    <option value="">— Müəssisə yoxdur —</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </>
              )}

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
