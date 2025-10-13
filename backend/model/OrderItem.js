import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

class OrderItem extends Model {}

OrderItem.init(
  {
    orderItemId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "order_item_id",   // ánh xạ cột DB
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "order_id",
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "variant_id",
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "product_id",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "quantity",
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "price",
    },
  },
  {
    sequelize,
    modelName: "OrderItem",      // tên model trong code
    tableName: "order_items",    // tên bảng trong DB
    timestamps: false,           // bảng không có created_at/updated_at
  }
);
export default OrderItem;