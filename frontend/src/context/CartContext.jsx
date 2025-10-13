
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../App.jsx";           // axios FE (đã có interceptor + token)
import { useAuth } from "../context/AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { user, isLoading: authBooting } = useAuth();

    const [cart, setCart] = useState(null);
    const [isWorking, setIsWorking] = useState(false);

    const cartCount = cart?.totalQty ?? 0;
    const subtotal = cart?.subtotal ?? 0;

    // ✅ Thêm tối thiểu: resetCart
    function resetCart() {
        setCart(null);
        setIsWorking(false);
    }

    // ---- GET /cart ----
    async function getCart() {
        setIsWorking(true);


        try {
            const res = await api.get("/internal/v1/getCartByUserId");
            const payload = res.data?.data ?? res.data;
            setCart(payload);

            /// log thử
            console.log("[CartContext] payload =", payload);
            console.table(payload?.items?.map(it => ({
                cartItemId: it.cartItemId,
                variantId: it.variantId,
                itemName: it.name,
                variantName: it.variant?.name,
                sku: it.variant?.sku
            })));
            ////

            return payload;
        } catch (err) {
            console.error("[Cart] getCart error", err);
            throw err; // hoặc swallow nếu muốn
        } finally {
            setIsWorking(false);
        }
    }





    // ---- POST /cartItem/addItems ----
    async function addToCart({ variantId, qty = 1 }) {
        setIsWorking(true);
        try {
            const res = await api.post("/internal/v1/addItems", { variantId, qty });
            const payload = res.data?.data ?? res.data;

            // Nếu BE trả về full cart -> setCart luôn; nếu không -> refetch
            if (payload?.cartId || payload?.items) setCart(payload);
            else await getCart();

            return payload;
        } finally {
            setIsWorking(false);
        }
    }



    async function updateQty({ variantId, qty }) {
        if (!Number.isInteger(variantId) || variantId <= 0) throw new Error("Invalid variantId");
        if (!Number.isInteger(qty) || qty < 0) throw new Error("qty must be an integer >= 0");

        setIsWorking(true);
        try {

            const res = await api.patch(`/internal/v1/updateCartItem`, { variantId, qty });
            const payload = res.data?.data ?? res.data; // dto toCartDTO
            if (payload?.cartId || payload?.items) setCart(payload);
            else await getCart(); // fallback
            return payload;
        } finally {
            setIsWorking(false);
        }
    }



    // ---- DELETE /cartItem/:cartItemId (xoá item theo id) ----
    async function removeItem(cartItemId) {
        const id = Number(cartItemId);
        if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid cartItemId");

        setIsWorking(true);
        try {
            const res = await api.delete(`/internal/v1/deleteCartItem/${id}`);
            const payload = res.data?.data ?? res.data; // BFF trả { success, data: <CartDTO> }

            // Nếu payload đã là CartDTO thì set luôn; nếu không, fallback gọi getCart()
            if (payload?.cartId || payload?.items) setCart(payload);
            else await getCart();

            return payload;
        } finally {
            setIsWorking(false);
        }
    }




    useEffect(() => {
        console.log("[Cart] user changed →", { userId: user?.userId });
        if (!user) {
            console.log("[Cart] user=null → clear cart");
            setCart(null);
            return;
        }
        console.log("[Cart] calling getCart() after login");
        getCart();
    }, [user?.userId, user?.id]); // thêm user?.id đề phòng



    const fmtVND = (n) =>
    Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });


    const value = useMemo(() => ({
        cart, cartCount, subtotal, updateQty,
        isWorking,
        getCart, addToCart,
        resetCart,fmtVND,
        setCart,removeItem
    }), [cart, cartCount, getCart, subtotal, isWorking]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within <CartProvider>");
    return ctx;
}


