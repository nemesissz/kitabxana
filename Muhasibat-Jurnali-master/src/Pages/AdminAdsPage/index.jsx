import styles from "./index.module.scss";
import DeleteIcon from "@mui/icons-material/Delete";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Base_Url_Server from "../../Constants/baseUrl";
import dataContext from "../../Contexts/GlobalState";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import CampaignIcon from "@mui/icons-material/Campaign";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";

function AdminAdsPage() {
  const store = useContext(dataContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ads"); // "spaces" or "ads"
  
  // Reklam alanları state
  const [adSpaces, setAdSpaces] = useState([]);
  const [editSpaceId, setEditSpaceId] = useState(null);
  const [formDataSpace, setFormDataSpace] = useState({
    name: "",
    position: "",
    description: "",
    width: "",
    height: "",
    is_active: true,
  });

  // Reklamlar state
  const [ads, setAds] = useState([]);
  const [editAdId, setEditAdId] = useState(null);
  const [formDataAd, setFormDataAd] = useState({
    ad_space_id: "",
    title: "",
    type: "banner",
    content: "",
    link_url: "",
    start_date: "",
    end_date: "",
    is_active: true,
    priority: 0,
    image: null,
  });
  const [loader, setLoader] = useState(false);

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

  // Fetch data
  useEffect(() => {
    fetchAdSpaces(); // Her zaman reklam alanlarını yükle (reklam eklerken dropdown için)
    if (activeTab === "ads") {
      fetchAds();
    }
  }, [activeTab]);

  const fetchAdSpaces = async () => {
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      const res = await axios.get(`${Base_Url_Server}ads/spaces`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setAdSpaces(res.data.data.ad_spaces);
    } catch (err) {
      console.error(err);
      Swal.fire("Xəta!", "Reklam alanları yüklənə bilmədi.", "error");
    }
  };

  const fetchAds = async () => {
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      const res = await axios.get(`${Base_Url_Server}ads`, {
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      setAds(res.data.data.ads);
    } catch (err) {
      console.error(err);
      Swal.fire("Xəta!", "Reklamlar yüklənə bilmədi.", "error");
    }
  };

  // Reklam alanları işlemleri
  const handleDeleteSpace = async (id) => {
    const result = await Swal.fire({
      title: "Silmək istədiyinizdən əminsiniz?",
      text: "Bu əməliyyatı geri qaytarmaq mümkün olmayacaq!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    });

    if (result.isConfirmed) {
      try {
        const tokenAdmin = localStorage.getItem("tokenAdmin");
        await axios.delete(`${Base_Url_Server}ads/spaces/${id}`, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        });
        setAdSpaces(adSpaces.filter((s) => s.id !== id));
        Swal.fire("Silindi!", "Reklam alanı uğurla silindi.", "success");
      } catch (err) {
        Swal.fire("Xəta!", err.response?.data?.message || "Reklam alanı silinə bilmədi.", "error");
      }
    }
  };

  const handleEditSpaceStart = (item) => {
    setEditSpaceId(item.id);
    setFormDataSpace({
      name: item.name,
      position: item.position,
      description: item.description || "",
      width: item.width || "",
      height: item.height || "",
      is_active: item.is_active === 1,
    });
  };

  const handleSpaceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormDataSpace((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSpaceSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      const data = {
        ...formDataSpace,
        width: formDataSpace.width ? parseInt(formDataSpace.width) : null,
        height: formDataSpace.height ? parseInt(formDataSpace.height) : null,
      };

      if (editSpaceId) {
        await axios.put(`${Base_Url_Server}ads/spaces/${editSpaceId}`, data, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        });
        Swal.fire("Uğur ✅", "Reklam alanı uğurla yeniləndi!", "success");
      } else {
        await axios.post(`${Base_Url_Server}ads/spaces`, data, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        });
        Swal.fire("Uğur ✅", "Reklam alanı uğurla əlavə edildi!", "success");
      }

      setLoader(false);
      setEditSpaceId(null);
      setFormDataSpace({
        name: "",
        position: "",
        description: "",
        width: "",
        height: "",
        is_active: true,
      });
      fetchAdSpaces();
    } catch (err) {
      setLoader(false);
      Swal.fire("Xəta ❌", err.response?.data?.message || "Əməliyyat uğursuz oldu.", "error");
    }
  };

  // Reklam işlemleri
  const handleDeleteAd = async (id) => {
    const result = await Swal.fire({
      title: "Silmək istədiyinizdən əminsiniz?",
      text: "Bu əməliyyatı geri qaytarmaq mümkün olmayacaq!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Bəli, sil!",
      cancelButtonText: "Ləğv et",
    });

    if (result.isConfirmed) {
      try {
        const tokenAdmin = localStorage.getItem("tokenAdmin");
        await axios.delete(`${Base_Url_Server}ads/${id}`, {
          headers: { Authorization: `Bearer ${tokenAdmin}` },
        });
        setAds(ads.filter((a) => a.id !== id));
        Swal.fire("Silindi!", "Reklam uğurla silindi.", "success");
      } catch (err) {
        Swal.fire("Xəta!", err.response?.data?.message || "Reklam silinə bilmədi.", "error");
      }
    }
  };

  const handleEditAdStart = (item) => {
    setEditAdId(item.id);
    setFormDataAd({
      ad_space_id: item.ad_space_id,
      title: item.title,
      type: item.type,
      content: item.content || "",
      link_url: item.link_url || "",
      start_date: item.start_date ? item.start_date.split("T")[0] + "T" + item.start_date.split("T")[1]?.split(".")[0] : "",
      end_date: item.end_date ? item.end_date.split("T")[0] + "T" + item.end_date.split("T")[1]?.split(".")[0] : "",
      is_active: item.is_active === 1,
      priority: item.priority || 0,
      image: null,
    });
  };

  const handleAdChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "image" && files.length > 0) {
      setFormDataAd((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormDataAd((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleAdSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    try {
      const tokenAdmin = localStorage.getItem("tokenAdmin");
      const formData = new FormData();
      formData.append("ad_space_id", formDataAd.ad_space_id);
      formData.append("title", formDataAd.title);
      formData.append("type", formDataAd.type);
      if (formDataAd.type === "banner" && formDataAd.image) {
        formData.append("image", formDataAd.image);
      } else if (formDataAd.type === "video") {
        formData.append("content", formDataAd.content);
      } else if (formDataAd.content) {
        formData.append("content", formDataAd.content);
      }
      if (formDataAd.link_url) formData.append("link_url", formDataAd.link_url);
      if (formDataAd.start_date) formData.append("start_date", formDataAd.start_date);
      if (formDataAd.end_date) formData.append("end_date", formDataAd.end_date);
      formData.append("is_active", formDataAd.is_active);
      formData.append("priority", formDataAd.priority);

      if (editAdId) {
        await axios.put(`${Base_Url_Server}ads/${editAdId}`, formData, {
          headers: {
            Authorization: `Bearer ${tokenAdmin}`,
            "Content-Type": "multipart/form-data",
          },
        });
        Swal.fire("Uğur ✅", "Reklam uğurla yeniləndi!", "success");
      } else {
        await axios.post(`${Base_Url_Server}ads`, formData, {
          headers: {
            Authorization: `Bearer ${tokenAdmin}`,
            "Content-Type": "multipart/form-data",
          },
        });
        Swal.fire("Uğur ✅", "Reklam uğurla əlavə edildi!", "success");
      }

      setLoader(false);
      setEditAdId(null);
      setFormDataAd({
        ad_space_id: "",
        title: "",
        type: "banner",
        content: "",
        link_url: "",
        start_date: "",
        end_date: "",
        is_active: true,
        priority: 0,
        image: null,
      });
      fetchAds();
    } catch (err) {
      setLoader(false);
      Swal.fire("Xəta ❌", err.response?.data?.message || "Əməliyyat uğursuz oldu.", "error");
    }
  };

  return (
    <div className={styles.adminAds}>
      <div className={styles.header}>
        <h3>Reklamları idarə et</h3>
        <div className={styles.tabs}>
          <button
            className={activeTab === "spaces" ? styles.active : ""}
            onClick={() => setActiveTab("spaces")}
          >
            <SpaceDashboardIcon /> Reklam Alanları
          </button>
          <button
            className={activeTab === "ads" ? styles.active : ""}
            onClick={() => setActiveTab("ads")}
          >
            <CampaignIcon /> Reklamlar
          </button>
        </div>
      </div>

      {/* Reklam Alanları Tab */}
      {activeTab === "spaces" && (
        <>
          <div className={styles.formSection}>
            <h4>{editSpaceId ? "Reklam alanını redaktə et" : "Yeni reklam alanı əlavə et"}</h4>
            <form onSubmit={handleSpaceSubmit}>
              <div className={styles.inputGroup}>
                <label>Ad *</label>
                <input
                  type="text"
                  name="name"
                  value={formDataSpace.name}
                  onChange={handleSpaceChange}
                  required
                  placeholder="Məs: Header Üstü"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Pozisyon Kodu *</label>
                <input
                  type="text"
                  name="position"
                  value={formDataSpace.position}
                  onChange={handleSpaceChange}
                  required
                  placeholder="Məs: header-top"
                  disabled={!!editSpaceId}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Təsvir</label>
                <textarea
                  name="description"
                  value={formDataSpace.description}
                  onChange={handleSpaceChange}
                  placeholder="Reklam alanının təsviri"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Genişlik (px)</label>
                  <input
                    type="number"
                    name="width"
                    value={formDataSpace.width}
                    onChange={handleSpaceChange}
                    placeholder="Opsiyonel"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Yükseklik (px)</label>
                  <input
                    type="number"
                    name="height"
                    value={formDataSpace.height}
                    onChange={handleSpaceChange}
                    placeholder="Opsiyonel"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formDataSpace.is_active}
                    onChange={handleSpaceChange}
                  />
                  Aktiv
                </label>
              </div>

              <div className={styles.buttonsWrapper}>
                <button type="submit" disabled={loader}>
                  {loader ? "Yüklənir..." : editSpaceId ? "Yenilə" : "Əlavə et"}
                </button>
                {editSpaceId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditSpaceId(null);
                      setFormDataSpace({
                        name: "",
                        position: "",
                        description: "",
                        width: "",
                        height: "",
                        is_active: true,
                      });
                    }}
                  >
                    Ləğv et
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={styles.tableSection}>
            <table>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Ad</th>
                  <th>Pozisyon</th>
                  <th>Ölçü</th>
                  <th>Status</th>
                  <th>Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {adSpaces.map((space, i) => (
                  <tr key={space.id}>
                    <td>{i + 1}</td>
                    <td>{space.name}</td>
                    <td>
                      <code>{space.position}</code>
                    </td>
                    <td>
                      {space.width && space.height
                        ? `${space.width}x${space.height}`
                        : "Avtomatik"}
                    </td>
                    <td>
                      <span
                        className={
                          space.is_active === 1 ? styles.active : styles.inactive
                        }
                      >
                        {space.is_active === 1 ? "Aktiv" : "Deaktiv"}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleEditSpaceStart(space)}>
                        <EditDocumentIcon />
                      </button>
                      <button onClick={() => handleDeleteSpace(space.id)}>
                        <DeleteIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Reklamlar Tab */}
      {activeTab === "ads" && (
        <>
          <div className={styles.formSection}>
            <h4>{editAdId ? "Reklamı redaktə et" : "Yeni reklam əlavə et"}</h4>
            <form onSubmit={handleAdSubmit}>
              <div className={styles.inputGroup}>
                <label>Reklam Alanı *</label>
                <select
                  name="ad_space_id"
                  value={formDataAd.ad_space_id}
                  onChange={handleAdChange}
                  required
                >
                  <option value="">Seçin</option>
                  {adSpaces
                    .filter((s) => s.is_active === 1)
                    .map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.name} ({space.position})
                      </option>
                    ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Başlıq *</label>
                <input
                  type="text"
                  name="title"
                  value={formDataAd.title}
                  onChange={handleAdChange}
                  required
                  placeholder="Reklam başlığı"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Tip *</label>
                <select
                  name="type"
                  value={formDataAd.type}
                  onChange={handleAdChange}
                  required
                >
                  <option value="banner">Banner (Şəkil)</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {formDataAd.type === "banner" && (
                <div className={styles.inputGroup}>
                  <label>Şəkil {!editAdId && "*"}</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleAdChange}
                    required={!editAdId && !formDataAd.content}
                  />
                  {editAdId && formDataAd.content && (
                    <p className={styles.hint}>
                      Mövcud şəkil: {formDataAd.content.split("/").pop()}
                    </p>
                  )}
                </div>
              )}

              {formDataAd.type === "video" && (
                <div className={styles.inputGroup}>
                  <label>Video Embed Kodu *</label>
                  <textarea
                    name="content"
                    value={formDataAd.content}
                    onChange={handleAdChange}
                    required
                    placeholder="<iframe>...</iframe> və ya video embed kodu"
                    rows={4}
                  />
                </div>
              )}

              <div className={styles.inputGroup}>
                <label>Link URL</label>
                <input
                  type="url"
                  name="link_url"
                  value={formDataAd.link_url}
                  onChange={handleAdChange}
                  placeholder="https://example.com"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Başlanğıc Tarixi</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formDataAd.start_date}
                    onChange={handleAdChange}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Bitmə Tarixi</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formDataAd.end_date}
                    onChange={handleAdChange}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Prioritet</label>
                  <input
                    type="number"
                    name="priority"
                    value={formDataAd.priority}
                    onChange={handleAdChange}
                    min="0"
                    placeholder="0"
                  />
                  <p className={styles.hint}>Yüksək sayı = daha yüksək prioritet</p>
                </div>

                <div className={styles.inputGroup}>
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formDataAd.is_active}
                      onChange={handleAdChange}
                    />
                    Aktiv
                  </label>
                </div>
              </div>

              <div className={styles.buttonsWrapper}>
                <button type="submit" disabled={loader}>
                  {loader ? "Yüklənir..." : editAdId ? "Yenilə" : "Əlavə et"}
                </button>
                {editAdId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditAdId(null);
                      setFormDataAd({
                        ad_space_id: "",
                        title: "",
                        type: "banner",
                        content: "",
                        link_url: "",
                        start_date: "",
                        end_date: "",
                        is_active: true,
                        priority: 0,
                        image: null,
                      });
                    }}
                  >
                    Ləğv et
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={styles.tableSection}>
            <table>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Başlıq</th>
                  <th>Alan</th>
                  <th>Tip</th>
                  <th>Tarix Aralığı</th>
                  <th>Tıklama</th>
                  <th>Görüntülənmə</th>
                  <th>Status</th>
                  <th>Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad, i) => (
                  <tr key={ad.id}>
                    <td>{i + 1}</td>
                    <td>{ad.title}</td>
                    <td>
                      <code>{ad.space_position}</code>
                    </td>
                    <td>{ad.type === "banner" ? "Banner" : "Video"}</td>
                    <td>
                      {ad.start_date || ad.end_date
                        ? `${ad.start_date ? new Date(ad.start_date).toLocaleDateString("az-AZ") : "Başlanğıc yoxdur"} - ${
                            ad.end_date ? new Date(ad.end_date).toLocaleDateString("az-AZ") : "Bitiş yoxdur"
                          }`
                        : "Məhdudiyyət yoxdur"}
                    </td>
                    <td>{ad.click_count || 0}</td>
                    <td>{ad.view_count || 0}</td>
                    <td>
                      <span
                        className={
                          ad.is_active === 1 ? styles.active : styles.inactive
                        }
                      >
                        {ad.is_active === 1 ? "Aktiv" : "Deaktiv"}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleEditAdStart(ad)}>
                        <EditDocumentIcon />
                      </button>
                      <button onClick={() => handleDeleteAd(ad.id)}>
                        <DeleteIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminAdsPage;

