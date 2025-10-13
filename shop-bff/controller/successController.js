import { getSuccessSummaryService } from "../service/customer/successService.js";

export async function getSuccessSummaryController(req, res, next) {
  try {
    const dto = await getSuccessSummaryService({ orderId: req.params.id });
    res.json(dto);
  } catch (err) { next(err); }
}