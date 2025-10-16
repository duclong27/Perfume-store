import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const toNumber = (val) => {
  if (val === " " || val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

const normalizeVariant = (v = {}) => ({
  price: toNumber(v.price),
  capacity:
    toNumber(v.capacityMl) ??
    toNumber(v.capacity_ml) ??
    toNumber(v.capacity) ??
    null,
  imageUrl: v.imageUrl ?? v.image_url ?? v.image ?? null,
});

/**
 * Helper: tính thống kê giá và label hiển thị
 * @param {Array} variants
 * @param {string} currencySymbol
 * @param {boolean} forceContact  // ép hiển thị "Contact" (khi isEnable=false)
 */
const buildPriceInfo = (variants, currencySymbol = "", forceContact = false) => {
  const list = (Array.isArray(variants) ? variants : []).map(normalizeVariant);

  if (forceContact) {
    return {
      min: null,
      max: null,
      isRange: false,
      label: "Contact",
      singleVariant: list.length === 1,
      singleCapacity: list.length === 1 ? list[0].capacity : null,
    };
  }

  const prices = list.map((x) => x.price).filter((n) => n != null);

  if (!prices.length) {
    return {
      min: null,
      max: null,
      isRange: false,
      label: "Contact",
      singleVariant: list.length === 1,
      singleCapacity: list.length === 1 ? list[0].capacity : null,
    };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = new Intl.NumberFormat("vi-VN").format;
  const label =
    min === max ? `${currencySymbol} ${fmt(min)}` : `${currencySymbol} ${fmt(min)} - ${fmt(max)}`;

  return {
    min,
    max,
    isRange: min !== max,
    label,
    singleVariant: list.length === 1,
    singleCapacity: list.length === 1 ? list[0].capacity : null,
  };
};

// ⬇️ thêm prop isEnable để biết có cần ép "Contact" không
const ProductItem = ({ id, image, name, variants, currency, isEnable }) => {
  const ctx = useContext(ShopContext);
  const currencySymbol = currency ?? ctx?.currency ?? "";

  // robust cho các kiểu giá trị: false/"false"/0
  const forceContact =
    isEnable === false ||
    String(isEnable).toLowerCase() === "false" ||
    isEnable === 0;

  const { label, isRange, singleVariant, singleCapacity } = useMemo(
    () => buildPriceInfo(variants, currencySymbol, forceContact),
    [variants, currencySymbol, forceContact]
  );

  const imgSrc = Array.isArray(image) ? image[0] : image;

  // ribbon text: Contact nếu bị disable, ngược lại giữ nguyên logic cũ
  const ribbonText = forceContact ? "Contact" : isRange ? "Price range" : "Price";
  const ribbonAria = forceContact
    ? "Contact label"
    : isRange
      ? "Price range across variants"
      : "Single price";

  return (
    <Link className="group text-gray-700 cursor-pointer" to={`/product/${id}`}>
      <div className="rounded-2xl border border-white/10 bg-black/80 p-3 shadow-md hover:shadow-xl hover:border-white/20 transition">
        {/* Image + ribbon */}
        <div className="relative overflow-hidden rounded-xl bg-neutral-900/60 w-full h-120">
          {imgSrc ? (
            <img
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              src={imgSrc}
              alt={name}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40">
              No Image
            </div>
          )}

          <span
            className="absolute top-3 left-3 rounded-full bg-white/90 text-black/90 px-3 py-1 text-sm font-semibold shadow"
            aria-label={ribbonAria}
            title={ribbonText}
          >
            {ribbonText}
          </span>
        </div>

        {/* Name */}
        <p className="pt-3 pb-1 text-2xl text-white line-clamp-1">{name}</p>

        {/* Price + capacity chip (chỉ khi 1 variant) */}
        <div className="mt-1 inline-flex items-center gap-2">
          <span className="inline-flex items-baseline gap-1 rounded-xl bg-gradient-to-r from-orange-100 via-amber-100 to-rose-100 px-3 py-1.5 text-2xl font-semibold text-neutral-900 shadow ring-1 ring-inset ring-orange-200">
            <span>{label}</span>
          </span>

          {singleVariant && singleCapacity != null && (
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-base font-medium text-white/90 ring-1 ring-white/20">
              {singleCapacity} ml
            </span>
          )}
        </div>

        {/* Gợi ý có nhiều capacity */}
        {!singleVariant && !forceContact && (
          <p className="mt-2 text-base text-white/70">More capacity added</p>
        )}
      </div>
    </Link>
  );
};

export default ProductItem;
