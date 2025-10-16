
import React from "react";
import { Link } from "react-router-dom";

const cx = (...xs) => xs.filter(Boolean).join(" ");

export default function AddressCard({
  addr,
  onSetDefault,
  onDelete,
  busyId = null,        // id đang setDefault
  deletingId = null,    // id đang xoá (từ parent)
  confirmDelete = true, // mặc định hỏi confirm
}) {
  const {
    addressId,
    recipientName,
    phoneNumber,
    addressLine,
    city,
    state,
    postalCode,
    country,
    isDefault,
  } = addr || {};

  const isBusyDel = deletingId === addressId;

  return (
    <div
      className={cx(
        "group relative rounded-3xl border shadow-sm transition-all",
        "bg-gradient-to-br from-indigo-50 via-white to-slate-50",
        "border-slate-200/70 backdrop-blur-xl",
        "hover:shadow-xl hover:-translate-y-0.5 hover:border-indigo-200"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="truncate font-semibold text-slate-900 text-lg md:text-xl">
            {recipientName}
          </h3>
          {isDefault && (
            <span
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-fuchsia-100 text-indigo-700 border border-indigo-200/80"
              title="Địa chỉ mặc định"
            >
              ⭐ <span>Mặc định</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm font-medium">
          {/* Edit */}
          <Link
            to={`/editAddressPage/${addressId}`}
            state={{ initialValues: addr }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90 transition"
            title="Sửa địa chỉ này"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>

          {!isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault?.(addressId)}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2",
                "border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400",
                "focus:outline-none focus:ring-2 focus:ring-indigo-200",
                "active:scale-[0.98] transition"
              )}
              title="Đặt làm mặc định"
            >
              ⭐ <span className="hidden sm:inline">Đặt mặc định</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!addressId) return;
              if (confirmDelete && !window.confirm("Bạn có chắc muốn xoá địa chỉ này?")) return;
              onDelete?.(addressId);
            }}
            disabled={isBusyDel}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2",
              "border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400",
              isBusyDel && "opacity-60 cursor-not-allowed"
            )}
            title="Xoá địa chỉ"
          >
            🗑️ <span className="hidden sm:inline">Xoá</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 pt-1 text-slate-700 leading-relaxed text-[15px] md:text-base">
        <div className="flex items-center gap-3">
          <span className="min-w-20 text-slate-500">SĐT:</span>
          <span className="font-semibold text-slate-900">{phoneNumber}</span>
        </div>

        {addressLine && (
          <div className="mt-1.5">
            <span className="text-slate-500 mr-2">Đ/c:</span>
            <span className="text-slate-800">{addressLine}</span>
          </div>
        )}

        {(city || state) && (
          <div className="mt-1.5">
            <span className="text-slate-500 mr-2">Khu vực:</span>
            <span className="text-slate-800">
              {[city, state].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {(postalCode || country) && (
          <div className="mt-1.5">
            <span className="text-slate-500 mr-2">Mã &amp; QG:</span>
            <span className="text-slate-800">
              {[postalCode, country].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 rounded-b-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-indigo-200" />
    </div>
  );
}
