
import { useState } from 'react';
import { products } from '../assets/assets'
import { createContext, useMemo } from 'react'
import { useEffect } from 'react';

import { toast } from "react-toastify";

export const ShopContext = createContext();

const clone = (obj) =>
  typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

const ShopContextProvider = (props) => {


  const currency = '$'
  const delivery_fee = 10;
  const [search, setSearch] = useState('');
  const [cartItems, setCartItems] = useState({});


  // Map nhanh: variant_id -> { product, variant }
  const variantMap = useMemo(() => {
    const m = new Map();
    for (const p of products) {
      for (const v of p.variants || []) {
        m.set(String(v.variant_id), { product: p, variant: v });
      }
    }
    return m;
  }, [products]);



  // ✅ addToCart CHỈ NHẬN variant_id, lưu cart theo variant_id
  const addToCart = (variantId, qty = 1) => {
    const hit = variantMap.get(String(variantId));
    if (!hit) return; // variant_id không tồn tại -> bỏ qua
    const { product, variant } = hit;

    setCartItems((prev) => {
      const next = clone(prev || {});
      const key = String(variant.variant_id);

      if (!next[key]) {
        next[key] = {
          product_id: product.id,
          variant_id: variant.variant_id,
          name: product.name,
          capacity_ml: variant.capacity_ml,
          price: variant.price, // snapshot giá tại thời điểm add
          qty: 0,
          sku: variant.sku,
          image: Array.isArray(product.image) ? product.image[0] : product.image || "",
        };
      }

      const maxStock = variant.stock ?? Infinity;
      next[key].qty = Math.min((next[key].qty || 0) + qty, maxStock);


      return next;
    });
  };



  const getCartCount = useMemo(
    () => Object.values(cartItems || {}).reduce((sum, it) => sum + (it?.qty || 0), 0),
    [cartItems]
  );



  {/*  Update Cart Item */ }

  const updateCartQty = (variantId, qtyOrDelta, mode = 'set') => {
    const hit = variantMap.get(String(variantId));
    if (!hit) return;

    const { product, variant } = hit;

    setCartItems((prev) => {
      const key = String(variant.variant_id);
      const currentLine = prev?.[key];
      const currentQty = currentLine?.qty ?? 0;

      // stock tối đa >= 0
      const maxStock = Math.max(0, Number.isFinite(variant.stock) ? variant.stock : Infinity);

      // Chuẩn hoá mode & giá trị
      // Hỗ trợ shorthand: 'inc' / 'dec'
      let effectiveMode = mode;
      let n = qtyOrDelta;

      if (typeof qtyOrDelta === 'string') {
        const s = qtyOrDelta.trim().toLowerCase();
        if (s === 'inc') { effectiveMode = 'delta'; n = +1; }
        else if (s === 'dec') { effectiveMode = 'delta'; n = -1; }
        else {
          // cố gắng parse số (vd: "5")
          n = Number(qtyOrDelta);
        }
      }

      const num = Math.floor(Number(n));
      if (!Number.isFinite(num)) return prev; // giá trị không hợp lệ -> bỏ qua

      // Tính qty mục tiêu
      const requested = effectiveMode === 'delta' ? currentQty + num : num;

      // Clamp theo [0, maxStock]
      const clamped = Math.min(Math.max(requested, 0), maxStock);

      // Không đổi -> khỏi clone để tránh re-render thừa
      if (clamped === currentQty) return prev;

      // qty = 0 -> xoá nếu đang có, nếu chưa có thì giữ nguyên
      if (clamped === 0) {
        if (!currentLine) return prev;
        const next = clone(prev || {});
        delete next[key];
        return next;
      }

      // Từ đây: clamped > 0
      const next = clone(prev || {});

      // Tạo mới nếu chưa có (giữ snapshot price)
      if (!currentLine) {
        next[key] = {
          product_id: product.id,
          variant_id: variant.variant_id,
          name: product.name,
          capacity_ml: variant.capacity_ml,
          price: variant.price, // snapshot tại thời điểm set
          qty: clamped,
          sku: variant.sku,
          image: Array.isArray(product.image) ? product.image[0] : product.image || "",
        };
      } else {
        // Cập nhật qty, giữ nguyên các field khác
        next[key] = { ...currentLine, qty: clamped };
      }

      return next;
    });
  };

  {/*  Get Cart Subtotal */ }

  const getCartSubtotal = (cartItems) => {
    return Object.values(cartItems || {}).reduce((sum, line) => {
      const price = Number(line.price) || 0;
      const qty = Number(line.qty) || 0;
      return sum + price * qty;
    }, 0);
  };

  // ...

  // bên trong ShopProvider
  const subtotal = useMemo(() => getCartSubtotal(cartItems), [cartItems]);


  const value = {
    products, currency, delivery_fee, search, setSearch,
    cartItems, setCartItems, addToCart, getCartCount, updateCartQty, getCartSubtotal, subtotal
  }

  return (
    <ShopContext.Provider value={value}>
      {props.children}
    </ShopContext.Provider>
  )

}

export default ShopContextProvider