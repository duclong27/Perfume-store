import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

 class ProductVariant extends Model {}

ProductVariant.init(
  {
    variantId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "variant_id",
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "product_id",
    },
    sku: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: "sku",
    },
    capacityMl: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "capacity_ml",
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "price",
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "stock",
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "image_url",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "ProductVariant",     // tên model trong code
    tableName: "product_variants",   // tên bảng trong DB
    timestamps: false,               // bảng chỉ có created_at
  }
);
export default ProductVariant;