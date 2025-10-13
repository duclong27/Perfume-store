import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, Package, ShoppingCart, Shield, LogOut, ListTree } from "lucide-react";

export default function Sidebar() {
    // helper: class cho NavLink đang active
    const itemClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition
     hover:bg-white/10 hover:text-white
     ${isActive ? "bg-white/15 text-white" : "text-slate-300"}`;


    const handleLogout = () => {
        // 1) Xóa token ở cả local & session (liệt kê một số key phổ biến)
        const tokenKeys = ["accessToken", "refreshToken", "jwt", "auth_token", "token", "user", "auth_user"];
        tokenKeys.forEach((k) => {
            try { localStorage.removeItem(k); } catch { }
            try { sessionStorage.removeItem(k); } catch { }
        });

        navigate("/login", { replace: true });
    };

    return (
        <aside
            className="
        fixed left-6 top-6 bottom-6 w-70
        rounded-2xl border border-white/10
        bg-gradient-to-b from-[#1b0f3a] via-[#1a154a] to-[#211a63]
        shadow-2xl shadow-black/40
        backdrop-blur-sm
      "
        >


            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
                    <Shield className="h-8 w-8 text-fuchsia-400" />
                    <span className="tracking-wide">Admin Panel</span>
                </Link>
            </div>



            <div className="mx-4 mb-4 h-px bg-white/10" />

            {/* Navigation */}
            <nav className="flex flex-col gap-9 px-2 text-[25px] font-medium">
                <NavLink to="admin/dashboard" className={itemClass}  >
                    <LayoutDashboard className="h-7 w-7" />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="admin/account" className={itemClass}>
                    <Users className="h-7 w-7" />
                    <span>Account</span>
                </NavLink>

                <NavLink to="admin/category" className={itemClass}>
                    <BarChart3 className="h-7 w-7" />
                    <span>Category</span>
                </NavLink>

                <NavLink to="admin/product" className={itemClass}>
                    <Package className="h-5 w-5" />
                    <span>Product</span>
                </NavLink>

                <NavLink to="admin/order" className={itemClass}>
                    <ShoppingCart className="h-5 w-5" />
                    <span>Order</span>
                </NavLink>
                <NavLink to="admin/variantProduct" className={itemClass}>
                    <ListTree className="h-5 w-5" />
                    <span>Variant</span>
                </NavLink>

            </nav>

            <div className="absolute bottom-4 left-0 w-full px-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Log Out</span>
                </button>
            </div>


        </aside>
    );
}
