import React, { useContext, useEffect, useState } from "react";
import styles from "./index.module.scss";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function AdminSubscriptionsPage() {
  const navigate = useNavigate();
  const store = useContext(dataContext);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editData, setEditData] = useState({ 
    plan_name: "",
    price: "",
    durationMonths: "",
    description: ""
  });
  const [newPlanData, setNewPlanData] = useState({
    plan_id: "",
    plan_name: "",
    price: "",
    durationMonths: "",
    description: ""
  });

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
      }).then(() => navigate("/admin/login"));
    } else {
      axios
        .get(Base_Url_Server + "users/" + adminID, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        })
        .then((res) => store.admin.setData(res.data.data.user))
        .catch(() => {
          store.admin.setData(null);
          localStorage.removeItem("tokenAdmin");
          localStorage.removeItem("admin");
          Swal.fire({
            title: "Giriş xətası",
            text: "Token etibarsızdır, yenidən daxil olun!",
            icon: "error",
            confirmButtonText: "OK",
          }).then(() => navigate("/admin/login"));
        });
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const tokenAdmin = localStorage.getItem("tokenAdmin");
    
    try {
      const response = await axios.get(Base_Url_Server + "admin/subscription-plans", {
        headers: { Authorization: `Bearer ${tokenAdmin}` }
      });
      
      // Convert object to array
      const plansObj = response.data.data.plans || {};
      const plansArray = Object.entries(plansObj).map(([planId, data]) => ({
        planId,
        ...data
      }));
      
      setPlans(plansArray);
      setLoading(false);
    } catch (error) {
      console.error("Planlar yüklenen zaman xəta:", error);
      setLoading(false);
      Swal.fire({
        title: "Xəta",
        text: "Planlar yüklenə bilmədi",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan.planId);
    setEditData({
      plan_name: plan.plan_name || "",
      price: plan.price?.toString() || "",
      durationMonths: plan.durationMonths?.toString() || "",
      description: plan.description || ""
    });
  };

  const handleUpdate = async () => {
    if (!editingPlan) return;

    const tokenAdmin = localStorage.getItem("tokenAdmin");

    try {
      await axios.put(
        `${Base_Url_Server}admin/subscription-plans/${editingPlan}`,
        {
          plan_name: editData.plan_name,
          price: editData.price,
          durationMonths: editData.durationMonths,
          description: editData.description
        },
        {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        }
      );

      await fetchPlans();
      setEditingPlan(null);
      setEditData({ plan_name: "", price: "", durationMonths: "", description: "" });

      Swal.fire({
        title: "Uğur ✅",
        text: "Plan uğurla yeniləndi!",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error("Yeniləmə xətası:", error);
      Swal.fire({
        title: "Xəta",
        text: "Plan yenilənə bilmədi",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setEditData({ plan_name: "", price: "", durationMonths: "", description: "" });
  };

  const handleOpenAddModal = () => {
    setNewPlanData({
      plan_id: "",
      plan_name: "",
      price: "",
      durationMonths: "",
      description: ""
    });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewPlanData({
      plan_id: "",
      plan_name: "",
      price: "",
      durationMonths: "",
      description: ""
    });
  };

  const handleAddPlan = async () => {
    if (!newPlanData.plan_id || !newPlanData.plan_name || !newPlanData.price || !newPlanData.durationMonths) {
      Swal.fire({
        title: "Xəta",
        text: "Zəhmət olmasa bütün məlumatları doldurun",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const tokenAdmin = localStorage.getItem("tokenAdmin");

    try {
      await axios.post(
        `${Base_Url_Server}admin/subscription-plans`,
        {
          plan_id: newPlanData.plan_id,
          plan_name: newPlanData.plan_name,
          price: newPlanData.price,
          durationMonths: newPlanData.durationMonths,
          description: newPlanData.description
        },
        {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        }
      );

      await fetchPlans();
      handleCloseAddModal();

      Swal.fire({
        title: "Uğur ✅",
        text: "Plan uğurla əlavə edildi!",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error("Əlavə xətası:", error);
      Swal.fire({
        title: "Xəta",
        text: error.response?.data?.message || "Plan əlavə edilə bilmədi",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loading}>
          <p>Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1>Abunəlik Planları İdarəetməsi</h1>
        <button 
          className={styles.addButton}
          onClick={handleOpenAddModal}
        >
          <AddIcon className={styles.addIcon} />
          Plan Əlavə Et
        </button>
      </div>

      <div className={styles.tableContainer}>
        {plans.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Plan tapılmadı</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plan ID</th>
                <th>Plan Adı</th>
                <th>Qiymət (AZN)</th>
                <th>Müddət (Ay)</th>
                <th>Təsvir</th>
                <th>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.planId}>
                  {editingPlan === plan.planId ? (
                    <>
                      <td>{plan.planId}</td>
                      <td>
                        <input
                          type="text"
                          value={editData.plan_name}
                          onChange={(e) =>
                            setEditData({ ...editData, plan_name: e.target.value })
                          }
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editData.price}
                          onChange={(e) =>
                            setEditData({ ...editData, price: e.target.value })
                          }
                          step="0.01"
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editData.durationMonths}
                          onChange={(e) =>
                            setEditData({ ...editData, durationMonths: e.target.value })
                          }
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editData.description}
                          onChange={(e) =>
                            setEditData({ ...editData, description: e.target.value })
                          }
                          className={styles.editInput}
                        />
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.saveBtn}
                            onClick={handleUpdate}
                          >
                            Yadda saxla
                          </button>
                          <button
                            className={styles.cancelBtn}
                            onClick={handleCancelEdit}
                          >
                            Ləğv et
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{plan.planId}</td>
                      <td>{plan.plan_name}</td>
                      <td>{plan.price} AZN</td>
                      <td>{plan.durationMonths} ay</td>
                      <td>{plan.description}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <Tooltip title="Redaktə et">
                            <button
                              className={styles.editBtn}
                              onClick={() => handleEdit(plan)}
                            >
                              <EditDocumentIcon />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Yeni Plan Əlavə Et</h2>
              <button 
                className={styles.closeBtn}
                onClick={handleCloseAddModal}
              >
                <CloseIcon />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Plan ID (məs: 12m):</label>
                <input
                  type="text"
                  value={newPlanData.plan_id}
                  onChange={(e) =>
                    setNewPlanData({ ...newPlanData, plan_id: e.target.value })
                  }
                  placeholder="12m"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Plan Adı:</label>
                <input
                  type="text"
                  value={newPlanData.plan_name}
                  onChange={(e) =>
                    setNewPlanData({ ...newPlanData, plan_name: e.target.value })
                  }
                  placeholder="12 Aylıq Abunəlik"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Qiymət (AZN):</label>
                <input
                  type="number"
                  value={newPlanData.price}
                  onChange={(e) =>
                    setNewPlanData({ ...newPlanData, price: e.target.value })
                  }
                  placeholder="Qiymət"
                  step="0.01"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Müddət (Ay):</label>
                <input
                  type="number"
                  value={newPlanData.durationMonths}
                  onChange={(e) =>
                    setNewPlanData({ ...newPlanData, durationMonths: e.target.value })
                  }
                  placeholder="12"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Təsvir:</label>
                <input
                  type="text"
                  value={newPlanData.description}
                  onChange={(e) =>
                    setNewPlanData({ ...newPlanData, description: e.target.value })
                  }
                  placeholder="12 aylıq abunəlik"
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={handleCloseAddModal}
              >
                Ləğv et
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleAddPlan}
              >
                Əlavə et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSubscriptionsPage;
