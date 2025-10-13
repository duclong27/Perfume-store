// Chỉ trả đúng 1 block tương ứng phương thức thanh toán.
// - BANK_TRANSFER  -> paymentInstructionsSnapshot (4 key bắt buộc)
// - COD            -> codInfo (message + hint)
// - VNPAY          -> vnpayResult (paid|failed)
export function toSuccessSummaryDTO(raw) {
    const o = raw?.data ?? raw;
    const method = o?.paymentMethodCode;
    const status = o?.paymentStatus;

    if (method === "BANK_TRANSFER" && o?.paymentInstructionsSnapshot) {
        const s = o.paymentInstructionsSnapshot;
        return {
            paymentInstructionsSnapshot: {
                note: s?.note ?? "",
                phone: s?.phone ?? "",
                imageUrl: s?.imageUrl ?? "",
                noteHint: s?.noteHint ?? "",
            },
        };
    }

    if (method === "COD") {
        return {
            codInfo: {
                message: "Thanh toán khi nhận hàng",
                hint: "Vui lòng chuẩn bị tiền mặt đúng số tiền trên đơn.",
            },
        };
    }

    if (method === "VNPAY") {
        if (status === "paid") {
            return {
                vnpayResult: {
                    status: "paid",
                    paidAt: o?.paidAt ?? null,
                    amountVnd: Number(o?.totalVnd ?? o?.totalAmount ?? 0),
                },
            };
        }
        return { vnpayResult: { status: "failed" } };
    }

    // fallback an toàn
    return {};
}
