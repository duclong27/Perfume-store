import React from 'react'

const CartTotal = () => {
    return (
        <div> {/* <!-- Cột phải: Tóm tắt --> */}
            <aside className=" mt-20 relative rounded-3xl p-6 bg-white/80 backdrop-blur-sm border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                {/* viền gradient mảnh luôn hiện sẵn */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/5" />
                <div className="pointer-events-none absolute -inset-[1px] rounded-[1.55rem] bg-[linear-gradient(120deg,rgba(255,148,69,0.25),rgba(255,214,102,0.25),rgba(255,105,180,0.25))]" />

                {/* Header */}
                <div className="relative z-[1]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                            Tóm tắt đơn hàng
                        </h2>
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-base font-medium ring-1 ring-inset ring-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Tiết kiệm
                        </span>
                    </div>

                    {/* Dòng tạm tính */}
                    <div className="mt-5  flex items-center justify-between text-3xl text-neutral-700">
                        <span>Tạm tính</span>
                        <span className="tabular-nums">{`{subtotalFormatted}`}</span>
                    </div>

                    {/* Giảm giá */}
                    <div className=" mt-5 flex items-center justify-between text-3xl text-neutral-700">
                        <span>Giảm giá</span>
                        <span className="tabular-nums text-rose-600">− {`{discountFormatted}`}</span>
                    </div>

                    {/* Vận chuyển */}
                    <div className=" mt-5 flex items-center justify-between text-3xl text-neutral-700">
                        <span>Vận chuyển</span>
                        <span className="tabular-nums">{`{shippingFormatted}`/* “Miễn phí” hoặc số tiền */}</span>
                    </div>

                    {/* Thuế */}
                    <div className="mt-2 border-t border-neutral-200 pt-3 flex items-center justify-between text-3xl text-neutral-700">
                        <span>Thuế (VAT)</span>
                        <span className="tabular-nums">{`{taxFormatted}`}</span>
                    </div>

                    {/* Tổng cộng */}
                    <div className="mt-2 border-t border-neutral-200 pt-3 flex items-center justify-between text-2xl">
                        <span className="text-2xl font-bold text-neutral-900">Tổng cộng</span>
                        <div className="text-right">
                            <div className="text-3xl font-extrabold tracking-tight text-neutral-900 tabular-nums">
                                {`{totalFormatted}`}
                            </div>
                            <div className="text-base text-neutral-500">Đã bao gồm VAT (nếu có)</div>
                        </div>
                    </div>

                    {/* Promo code */}
                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                        <input
                            type="text"
                            placeholder="Nhập mã giảm giá"
                            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-2xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-amber-200"
                        />
                        <button
                            className="rounded-2xl px-5 py-3 text-2xl font-semibold text-neutral-900 bg-gradient-to-r from-orange-200 via-amber-200 to-rose-200 ring-1 ring-inset ring-orange-300 hover:shadow-md active:scale-[0.98] transition"
                        >
                            Áp dụng
                        </button>
                    </div>

                    {/* Nút thanh toán */}
                    <button
                        className="mt-4 w-full py-4 rounded-2xl text-2xl font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] shadow-[0_10px_24px_rgba(0,0,0,0.15)] transition"
                    >
                        Thanh toán
                    </button>

                    {/* Note */}
                    <p className="mt-2 text-center text-base text-neutral-500">
                        Bằng cách tiếp tục, bạn đồng ý với <a href="#" className="underline hover:text-neutral-700">điều khoản</a> & <a href="#" className="underline hover:text-neutral-700">chính sách</a>.
                    </p>
                </div>
            </aside>
        </div>
    )
}

export default CartTotal