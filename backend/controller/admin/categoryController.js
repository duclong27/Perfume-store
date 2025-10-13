import {
  addCategoriesService,
  updateCategoryService,
  deleteCategoryService,
  getAllCategoriesService,
  listCategoryOptionsService
}
  from "../../service/admin/categoryService.js";



const addCategoriesController = async (req, res) => {
  try {
    const { name, description } = req.body || {};
    const { category } = await addCategoriesService({ name, description }); // <-- await + đúng key
    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    const status =
      err.status || err.statusCode || (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);
    console.error("Category add error:", err);
    return res.status(status).json({
      success: false,
      message: err.message || "Category add error",
    });
  }
};





const updateCategoryController = async (req, res) => {
  try {

    const categoryId = Number(req.params.id);
    const { name, description } = req.body || {};

    const { category } = await updateCategoryService({
      categoryId,
      name,
      description,
    });

    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err?.name === "SequelizeUniqueConstraintError" ? 409 : 500);

    console.error("Category update error:", err);

    return res.status(status).json({
      success: false,
      message: err.message || "Category update error",
    });
  }
};



const deleteCategoryController = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const { category } = await deleteCategoryService({ categoryId });
    return res.status(200).json({ success: true, data: category });

  } catch (err) {
    const status =
      err.status ||
      err.statusCode ||
      (err?.name === "SequelizeForeignKeyConstraintError" ? 409 : 500);
    console.error("Category delete error:", err);
    return res.status(status).json({
      success: false,
      message:
        err?.name === "SequelizeForeignKeyConstraintError"
          ? "Category is in use and cannot be deleted"
          : err.message || "Category delete error",
    });
  }
};



const getCategoriesController = async (req, res) => {
  try {
    const { view, q, page, limit } = req.query;

    if (view === "options") {
      const { items } = await listCategoryOptionsService();
      return res.status(200).json({ success: true, data: items }); // [{value,label}]
    }

    const { rows, total, page: p, limit: l } = await getAllCategoriesService({ q, page, limit });
    return res.status(200).json({ success: true, data: rows, total, page: p, limit: l });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message || "Get categories error" });
  }
};





export { addCategoriesController, updateCategoryController, deleteCategoryController, getCategoriesController }