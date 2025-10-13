import { AppError } from "../../utils/AppError.js";
import Category from "../../model/Category.js"
import { Op, fn, col, where } from "sequelize";



export async function addCategoriesService({ name, description } = {}) {
    const n = typeof name === "string" ? name.trim() : "";
    const d = typeof description === "string" ? description.trim() : null;

    if (!n) throw new AppError("Name must be typed", 400);

    const existed = await Category.findOne({
        where: where(fn("LOWER", col("name")), n.toLowerCase()),
        attributes: ["categoryId"],
    });
    if (existed) throw new AppError("Category already added", 409);

    const category = await Category.create({ name: n, description: d });
    return { category };
}



export async function updateCategoryService({
    categoryId,
    name,          // optional
    description,   // optional
} = {}) {
    // 1) Validate id
    const id = Number(categoryId);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("Invalid categoryId", 400);
    }

    // 2) Tìm category
    const category = await Category.findByPk(id);
    if (!category) {
        throw new AppError("Category not found", 404);
    }

    const updates = {};

    // 3) Xử lý name (nếu được truyền vào)
    if (typeof name !== "undefined") {
        const n = typeof name === "string" ? name.trim() : "";
        if (!n) {
            throw new AppError("Name must be typed", 400);
        }

        const currentName = (category.name ?? "").trim();
        const sameIgnoringCase = currentName.toLowerCase() === n.toLowerCase();

        // Chỉ check trùng khi thực sự đổi tên (khác nhau theo lowercase)
        if (!sameIgnoringCase) {
            const dup = await Category.findOne({
                where: {
                    [Op.and]: [
                        where(fn("LOWER", col("name")), n.toLowerCase()),
                        { categoryId: { [Op.ne]: id } },
                    ],
                },
                attributes: ["categoryId"],
            });
            if (dup) {
                throw new AppError("Category already added", 409);
            }
        }

        if (category.name !== n) {
            updates.name = n;
        }
    }

    // 4) Xử lý description (nếu được truyền vào)
    if (typeof description !== "undefined") {
        // Cho phép null để xoá mô tả; nếu string rỗng -> chuyển thành null
        let d = description;
        if (typeof d === "string") d = d.trim();
        if (d === "") d = null;

        if (category.description !== d) {
            updates.description = d;
        }
    }

    // 5) Không có thay đổi nào -> trả về nguyên trạng
    if (Object.keys(updates).length === 0) {
        return { category };
    }

    // 6) Lưu thay đổi
    await category.update(updates);
    return { category };
}

export async function deleteCategoryService({ categoryId } = {}) {
    const id = Number(categoryId);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError("Invalid categoryId", 400);
    }

    const category = await Category.findByPk(id);
    if (!category) {
        throw new AppError("Category not found", 404);
    }

    const snapshot = category.get ? category.get({ plain: true }) : { categoryId: id };
    await category.destroy(); // có thể throw FK constraint nếu đang được tham chiếu

    return { category: snapshot }
}

export async function getAllCategoriesService({ page = 1, limit = 20, q } = {}) {
    const p = Number.isFinite(+page) && +page > 0 ? Math.floor(+page) : 1;
    const l = Number.isFinite(+limit) && +limit > 0 ? Math.min(100, Math.floor(+limit)) : 20;
    const offset = (p - 1) * l;

    const ql = typeof q === "string" ? q.trim().toLowerCase() : "";
    const nameFilter = ql
        ? { [Op.and]: [where(fn("LOWER", col("name")), { [Op.like]: `%${ql}%` })] }
        : undefined;

    const { rows, count } = await Category.findAndCountAll({
        where: nameFilter,
        attributes: ["categoryId", "name", "description"],
        order: [["name", "ASC"]],
        limit: l,
        offset,
    });

    return { rows, total: count, page: p, limit: l };
}


export async function listCategoryOptionsService() {
    const categories = await Category.findAll({
        attributes: ["categoryId", "name"],
        order: [["name", "ASC"]],
    });
    const items = categories.map(c => ({ value: c.categoryId, label: c.name }));
    return { items };
}


