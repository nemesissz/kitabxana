import { useContext } from "react";
import dataContext from "../../Contexts/GlobalState";
import styles from "./index.module.scss";
import CircularProgress from "@mui/material/CircularProgress";
function AdminLoader() {
  const store = useContext(dataContext);

  return (
    <div
      style={store.loader.data ? {} : { display: "none" }}
      className={styles.loader}
    >
      <CircularProgress size={60} thickness={5} color="primary" />
    </div>
  );
}

export default AdminLoader;
