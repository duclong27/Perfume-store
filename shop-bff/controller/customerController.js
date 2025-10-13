import { getCustomerInfoService } from "../service/customer/customerService.js";
import { passCoreError } from "../utils/errorMapper.js";


export const getCustomerInfoController = async (req, res) => {
    try {
        const userId = Number(
            (req.user && req.user.userId)
            ?? (req.auth && req.auth.userId)

        );

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(401).json({ success: false, message: "Unauthorized (no userId)" });
        }

        const user = await getCustomerInfoService({ userId });
        return res.status(200).json({ success: true, data: user });
    } catch (err) {
        return passCoreError(res, err);
    }
};