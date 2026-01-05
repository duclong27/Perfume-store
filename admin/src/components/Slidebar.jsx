


// /src/components/Sidebar.jsx
// import { NavLink, Link, useNavigate } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Users,
//   BarChart3,
//   Package,
//   ShoppingCart,
//   Shield,
//   LogOut,
//   ListTree,
// } from "lucide-react";

// export default function Sidebar() {
//   const navigate = useNavigate();

//   const itemClass = ({ isActive }) =>
//     `flex items-center gap-3 rounded-xl transition
//      hover:bg-white/10 hover:text-white
//      ${isActive ? "bg-white/15 text-white" : "text-slate-300"}
//      px-4 py-2 lg:py-3
//      text-base lg:text-lg`;

//   const handleLogout = () => {
//     const tokenKeys = ["accessToken", "refreshToken", "jwt", "auth_token", "token", "user", "auth_user"];
//     tokenKeys.forEach((k) => {
//       try { localStorage.removeItem(k); } catch { }
//       try { sessionStorage.removeItem(k); } catch { }
//     });
//     navigate("/login", { replace: true });
//   };

//   return (
//     <aside
//       className="
//         fixed left-6 top-6 bottom-6
//         w-64 lg:w-72
//         rounded-2xl border border-white/10
//         bg-gradient-to-b from-[#1b0f3a] via-[#1a154a] to-[#211a63]
//         shadow-2xl shadow-black/40 backdrop-blur-sm
//         flex flex-col
//         overflow-hidden
//       "
//     >

//       <div className="flex items-center gap-3 px-6 py-6 shrink-0">
//         <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
//           <Shield className="h-8 w-8 text-fuchsia-400" />
//           <span className="tracking-wide">Admin Panel</span>
//         </Link>
//       </div>

//       <div className="mx-4 h-px bg-white/10 shrink-0" />


//       <nav
//         className="
//           flex-1
//           overflow-y-auto
//           px-2
//           py-4
//           flex flex-col
//           gap-2 lg:gap-3
//         "
//       >
//         <NavLink to="admin/dashboard" className={itemClass}>
//           <LayoutDashboard className="h-6 w-6" />
//           <span>Dashboard</span>
//         </NavLink>

//         <NavLink to="admin/account" className={itemClass}>
//           <Users className="h-6 w-6" />
//           <span>Account</span>
//         </NavLink>

//         <NavLink to="admin/category" className={itemClass}>
//           <BarChart3 className="h-6 w-6" />
//           <span>Category</span>
//         </NavLink>

//         <NavLink to="admin/product" className={itemClass}>
//           <Package className="h-5 w-5" />
//           <span>Product</span>
//         </NavLink>

//         <NavLink to="admin/order" className={itemClass}>
//           <ShoppingCart className="h-5 w-5" />
//           <span>Order</span>
//         </NavLink>

//         <NavLink to="admin/variantProduct" className={itemClass}>
//           <ListTree className="h-5 w-5" />
//           <span>Variant</span>
//         </NavLink>
//       </nav>


//       <div className="px-4 pb-4 pt-2 shrink-0 border-t border-white/10 bg-black/0">
//         <button
//           onClick={handleLogout}
//           className="
//             w-full flex items-center gap-3 px-4 py-3 rounded-xl
//             bg-white/10 text-slate-300
//             hover:bg-red-500/20 hover:text-red-400 transition
//           "
//         >
//           <LogOut className="h-5 w-5" />
//           <span>Log Out</span>
//         </button>
//       </div>
//     </aside>
//   );
// }



import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Package,
  ShoppingCart,
  Shield,
  LogOut,
  ListTree,
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();


  const itemClass = ({ isActive }) =>
    [
      "group flex items-center gap-3 rounded-xl transition",
      "hover:bg-white/10 hover:text-white",
      isActive ? "bg-white/15 text-white" : "text-slate-300",
      "px-3 lg:px-4 py-2 lg:py-3",
      "text-base lg:text-lg",
    ].join(" ");

  const handleLogout = () => {
    const tokenKeys = ["accessToken", "refreshToken", "jwt", "auth_token", "token", "user", "auth_user"];
    tokenKeys.forEach((k) => {
      try { localStorage.removeItem(k); } catch { }
      try { sessionStorage.removeItem(k); } catch { }
    });
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={[

        "fixed left-3 sm:left-4 lg:left-6 top-3 sm:top-4 lg:top-6 bottom-3 sm:bottom-4 lg:bottom-6",

        "w-[72px] lg:w-72",
        "rounded-2xl border border-white/10",
        "bg-gradient-to-b from-[#1b0f3a] via-[#1a154a] to-[#211a63]",
        "shadow-2xl shadow-black/40 backdrop-blur-sm",
        "flex flex-col overflow-hidden",

        "shrink-0",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-3 lg:px-6 py-6 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-white">
          <Shield className="h-8 w-8 text-fuchsia-400" />
          {/* ✅ ẩn chữ dưới lg */}
          <span className="hidden lg:inline text-xl font-bold tracking-wide">Admin Panel</span>
        </Link>
      </div>

      <div className="mx-3 lg:mx-4 h-px bg-white/10 shrink-0" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-2 lg:gap-3">
        <NavLink to="admin/dashboard" className={itemClass} title="Dashboard">
          <LayoutDashboard className="h-6 w-6 shrink-0" />
          <span className="hidden lg:inline">Dashboard</span>
        </NavLink>

        <NavLink to="admin/account" className={itemClass} title="Account">
          <Users className="h-6 w-6 shrink-0" />
          <span className="hidden lg:inline">Account</span>
        </NavLink>

        <NavLink to="admin/category" className={itemClass} title="Category">
          <BarChart3 className="h-6 w-6 shrink-0" />
          <span className="hidden lg:inline">Category</span>
        </NavLink>

        <NavLink to="admin/product" className={itemClass} title="Product">
          <Package className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Product</span>
        </NavLink>

        <NavLink to="admin/order" className={itemClass} title="Order">
          <ShoppingCart className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Order</span>
        </NavLink>

        <NavLink to="admin/variantProduct" className={itemClass} title="Variant">
          <ListTree className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Variant</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-2 lg:px-4 pb-4 pt-2 shrink-0 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={[
            "w-full flex items-center gap-3 rounded-xl transition",
            "bg-white/10 text-slate-300",
            "hover:bg-red-500/20 hover:text-red-400",
            "px-3 lg:px-4 py-3",
            "justify-center lg:justify-start",
          ].join(" ")}
          title="Log Out"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="hidden lg:inline">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
