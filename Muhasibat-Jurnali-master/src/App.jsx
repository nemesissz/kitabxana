import "./App.css";
import { RouterProvider } from "react-router-dom";
import router from "./Routes/route";
import { DataProvider } from "./Contexts/GlobalState";

function App() {
  return (
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  );
}

export default App;
