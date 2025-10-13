import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export class Product extends Model {}

Product.init(
  {
    productId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "product_id",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "category_id",
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "name",
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "brand",
    },
    gender: {
      type: DataTypes.ENUM("Man", "Woman", "Unisex"),
      defaultValue: "Unisex",
      field: "gender",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "description",
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "image_url",
    },
    isEnable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_enable",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Product",   // tên model trong code
    tableName: "products",  // tên bảng trong DB
    timestamps: false,      // chỉ có created_at, không có updated_at
  }
);
export default Product;