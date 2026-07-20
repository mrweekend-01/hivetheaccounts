import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Accounts from "./pages/Accounts";
import Devices from "./pages/Devices";
import Humanization from "./pages/Humanization";
import Tasks from "./pages/Tasks";
import UrgentTasks from "./pages/UrgentTasks";
import Users from "./pages/Users";

export default function App() {
  const { loading } = useAuth();
  if (loading)
    return <div className="min-h-screen grid place-items-center text-hive-muted">Cargando…</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/accounts" replace />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/humanization" element={<Humanization />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/urgent-tasks" element={<ProtectedRoute role="admin"><UrgentTasks /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute role="admin"><Users /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/accounts" replace />} />
    </Routes>
  );
}
