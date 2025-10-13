
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Sidebar from "./components/Slidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Product from "./pages/Product";
import axios from "axios";
import Category from "./pages/Category";
import AddCategory from "./pages/AddCategory";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import VariantProduct from "./pages/VariantProduct"
import AddVariant from "./pages/AddVariant";
import EditCategory from "./pages/EditCategory";
import EditVariant from "./pages/EditVariant";
import AddProductForm from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct"
import Order from "./pages/Order"
import AdminAccounts from "./pages/Account"; 
import AddAccountPage from "./pages/AddAccount"; 



export const backendUrl = import.meta.env.VITE_BACKEND_URL

export const api = axios.create({
  baseURL: backendUrl.replace(/\/+$/, ""), // bỏ dấu / cuối
  withCredentials: false,
});


console.log("[API] baseURL =", api.defaults.baseURL);




// Route guard: nhận token từ App (KHÔNG đọc localStorage)
function ProtectedRoute({ token }) {
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Layout cho khu admin (có Sidebar)
function AdminLayout({ onLogout }) {
  return (
    <div className="flex w-full">
      <Sidebar onLogout={onLogout} />
      <main className="flex-1 ml-[20rem] mr-2 p-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {

  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  const handleLogout = () => setToken("");

  return (
    <div className="relative flex min-h-screen overflow-hidden text-white">
      <ToastContainer position="top-right" autoClose={2500} theme="dark" />
      {/* NỀN CHÍNH: giữ nguyên của bạn */}
      <div className="absolute inset-0 -z-50 bg-gradient-to-br from-[#1a1240] via-[#2a1b6a] to-[#6a31d0]" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#8b5cf6] opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-24 h-[28rem] w-[28rem] rounded-full bg-[#a78bfa] opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-140px] left-32 h-[26rem] w-[26rem] rounded-full bg-[#7c3aed] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500 opacity-30 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-violet-600 opacity-30 blur-[150px]" />

      <Routes>
        {/* 
            Nếu đã có token rồi mà vào /login thì đưa về dashboard */}
        <Route
          path="/login"
          element={
            token
              ? <Navigate to="/admin/dashboard" replace />
              : <Login setToken={setToken} />
          }
        />

        {/* Khu admin: cần token (ProtectedRoute) + layout có Sidebar */}
        <Route element={<ProtectedRoute token={token} />}>
          <Route element={<AdminLayout onLogout={handleLogout} />}>
            <Route>
<Route path="/admin/addAccount" element={<AddAccountPage />} />
              <Route path="/admin/account" element={<AdminAccounts />} />
               <Route path="/admin/order" element={<Order />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/product" element={<Product />} />
              <Route path="/admin/category" element={<Category />} />
              <Route path="/admin/addCategory" element={<AddCategory />} />
              <Route path="/admin/variantProduct" element={<VariantProduct />} />
              <Route path="/admin/addVariant" element={<AddVariant />} />
              <Route path="/admin/editCategory/:id" element={<EditCategory />} />
              <Route path="/admin/editVariant/:id" element={<EditVariant />} />
              <Route path="/admin/addProduct" element={<AddProductForm />} />
              <Route path="/admin/editProduct/:id" element={<EditProduct />} />

            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={token ? "/admin/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
}
