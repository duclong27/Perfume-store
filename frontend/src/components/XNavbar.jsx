
import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";        // giữ để dùng search
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";            // ✅ NEW: lấy cartCount từ CartContext
import { assets as defaultAssets } from "../assets/assets";

/**
 * XNavbar
 * - Auth: useAuth() (user, isLoading, logout)
 * - Cart: useCart() (cartCount)  ← thay cho ShopContext.getCartCount
 * - Search: vẫn dùng từ ShopContext (search, setSearch) trong giai đoạn chuyển dần
 * - Dropdown đóng khi click ra ngoài
 */
export default function XNavbar({ assets: assetsProp }) {
  const assets = assetsProp || defaultAssets;

  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Search vẫn lấy từ ShopContext
  const { search, setSearch } = useContext(ShopContext);

  // Auth
  const { user, isLoading, logout } = useAuth();

  // ✅ Cart (thay vì getCartCount từ ShopContext)
  const { cartCount } = useCart();
  const { resetCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  // Chữ cái avatar
  const userInitial = useMemo(() => {
    const s = String(user?.name || user?.email || "?").trim();
    return s ? s.charAt(0).toUpperCase() : "?";
  }, [user]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  // Điều hướng auth
  function goLogin() {
    navigate("/loginPage", { state: { from: location.pathname } });
  }
  function goRegister() {
    navigate("/signUpPage", { state: { from: location.pathname } });
  }
  function handleLogout() {
    try {
      resetCart?.();         // badge về 0 ngay lập tức
      logout?.();            // xoá token, setUser(null)
      setMenuOpen(false);    // đóng dropdown
      setVisible(false);     // đóng mobile menu nếu đang mở
    } catch { }
  }


  const goOrdersSearch = () => {
    const q = (search || "").trim();
    const target = "/myOrder";                          // đường dẫn trang đơn hàng của bạn
    const qs = q ? `?orders_q=${encodeURIComponent(q)}` : "";
    if (location.pathname.startsWith(target)) {
      navigate(`${target}${qs}`, { replace: false });   // đang ở Orders → chỉ cập nhật query
    } else {
      navigate(`${target}${qs}`);                       // từ trang khác → điều hướng sang Orders
    }
  };


  useEffect(() => {
    console.log("[Navbar] badge cartCount =", cartCount, "(totalQty from cart)");
  }, [cartCount]);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/30 backdrop-blur-sm">
      <div className="flex items-center justify-between py-4 px-6 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] font-medium">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2">
            {assets?.logo ? (
              <img src={assets.logo} className="w-36" alt="Logo" />
            ) : (
              <span className="text-yellow-400 font-extrabold text-2xl">ARVENA</span>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 hidden sm:flex justify-center">
          <ul className="flex gap-6 text-[18px] text-white/90">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `group flex flex-col items-center gap-1 ${isActive ? "text-white" : "hover:text-white"}`
                }
              >
                <p>HOME</p>
                <span className="w-2/4 h-1.5 bg-white/80 rounded transition-opacity group-hover:opacity-100 opacity-0" />
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/collection"
                className={({ isActive }) =>
                  `group flex flex-col items-center gap-1 ${isActive ? "text-white" : "hover:text-white"}`
                }
              >
                <p>COLLECTION</p>
                <span className="w-2/4 h-1.5 bg-white/80 rounded transition-opacity group-hover:opacity-100 opacity-0" />
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `group flex flex-col items-center gap-1 ${isActive ? "text-white" : "hover:text-white"}`
                }
              >
                <p>ABOUT</p>
                <span className="w-2/4 h-1.5 bg-white/80 rounded transition-opacity group-hover:opacity-100 opacity-0" />
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contactPage"
                className={({ isActive }) =>
                  `group flex flex-col items-center gap-1 ${isActive ? "text-white" : "hover:text-white"}`
                }
              >
                <p>CONTACT</p>
                <span className="w-2/4 h-1.5 bg-white/80 rounded transition-opacity group-hover:opacity-100 opacity-0" />
              </NavLink>
            </li>
          </ul>
        </div>

        {/* RIGHT: Search + Auth + Cart */}
        <div className="flex items-center gap-4 sm:gap-6">

          {/* Search */}
          {/* <div className="hidden md:flex items-center gap-3 rounded-2xl bg-black/40 backdrop-blur-md px-4 py-2 shadow-lg border border-white/10 w-[22rem] max-w-[42vw]">
            {assets?.search_icon2 && <img src={assets.search_icon2} alt="Search" className="w-4" />}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent outline-none text-base placeholder-white/70 text-white flex-1"
            />
          </div> */}


          {/* Search */}
          <div className="hidden md:flex items-center gap-3 rounded-2xl bg-black/40 backdrop-blur-md px-4 py-2 shadow-lg border border-white/10 w-[22rem] max-w-[42vw]">
            {/* biến icon thành button để click tìm */}
            <button
              type="button"
              onClick={goOrdersSearch}
              className="shrink-0 opacity-90 hover:opacity-100 transition"
              aria-label="Tìm đơn hàng"
              title="Tìm đơn hàng"
            >
              {assets?.search_icon2 && <img src={assets.search_icon2} alt="Search" className="w-4" />}
            </button>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); goOrdersSearch(); } }}
              placeholder="Search..."
              className="bg-transparent outline-none text-base placeholder-white/70 text-white flex-1"
            />
          </div>

          {/* Auth area */}
          {isLoading ? (
            <div className="h-10 min-w-24 rounded-xl bg-white/10 text-white/70 grid place-items-center px-4">Loading…</div>
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="flex items-center gap-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white px-3 py-2 shadow border border-white/10"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 text-black font-bold grid place-items-center">
                  {userInitial}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs opacity-80">Xin chào,</div>
                  <div className="text-sm font-semibold truncate max-w-[10rem]">
                    {user?.name || user?.email || "Customer"}
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
                  <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur border border-black/10 shadow-xl rounded-xl overflow-hidden z-[60]"
                >
                  <Link to="/AddressPage" className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-100">Tài khoản</Link>
                  <Link to="/myOrder" className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-100">Đơn hàng</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50">Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={goLogin}
                className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 shadow"
              >
                Đăng nhập
              </button>
              <button
                onClick={goRegister}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 text-black font-semibold shadow hover:brightness-95"
              >
                Đăng ký
              </button>
            </div>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative ml-1" aria-label="Open cart">
            {assets?.cart_icon ? (
              <img src={assets.cart_icon} className="w-10 min-w-10 drop-shadow" alt="Cart" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center text-white">🛒</div>
            )}
            {cartCount > 0 && (
              <span className="absolute right-[-6px] bottom-[-8px] min-w-[22px] h-[22px] px-1 rounded-full bg-black text-white text-[12px] grid place-items-center border border-white/30">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="sm:hidden ml-1 w-10 h-10 grid place-items-center rounded-xl bg-white/10 text-white border border-white/15"
            onClick={() => setVisible(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Slide-over mobile menu */}
        <div className={`sm:hidden fixed top-0 right-0 h-screen transition-all duration-300 bg-white/95 backdrop-blur shadow-2xl ${visible ? "w-[80%]" : "w-0"}`}>
          <div className="h-full overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <span className="font-bold">Menu</span>
              </div>
              <button onClick={() => setVisible(false)} className="w-9 h-9 grid place-items-center rounded-lg bg-black/5" aria-label="Close menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col text-gray-700">
              <NavLink onClick={() => setVisible(false)} className="py-3 px-6 border-b hover:bg-black/5" to="/">HOME</NavLink>
              <NavLink onClick={() => setVisible(false)} className="py-3 px-6 border-b hover:bg-black/5" to="/collection">COLLECTION</NavLink>
              <NavLink onClick={() => setVisible(false)} className="py-3 px-6 border-b hover:bg-black/5" to="/about">ABOUT</NavLink>
              <NavLink onClick={() => setVisible(false)} className="py-3 px-6 border-b hover:bg-black/5" to="/contactPage">CONTACT</NavLink>
              <div className="p-4">
                {user ? (
                  <>
                    <div className="mb-3 text-sm text-gray-500">
                      Xin chào, <span className="font-semibold text-gray-800">{user?.name || user?.email}</span>
                    </div>
                    <Link onClick={() => setVisible(false)} to="/account" className="block w-full mb-2 px-4 py-2 rounded-lg bg-black/5">Tài khoản</Link>
                    <Link onClick={() => setVisible(false)} to="/orders" className="block w-full mb-2 px-4 py-2 rounded-lg bg-black/5">Đơn hàng</Link>
                    <button onClick={handleLogout} className="block w-full px-4 py-2 rounded-lg bg-red-50 text-red-600">Đăng xuất</button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { setVisible(false); goLogin(); }} className="flex-1 h-10 rounded-lg bg-black/10">Đăng nhập</button>
                    <button onClick={() => { setVisible(false); goRegister(); }} className="flex-1 h-10 rounded-lg bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 text-black font-semibold">Đăng ký</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
