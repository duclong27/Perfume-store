import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

class OrderItem extends Model {}

OrderItem.init(
  {
    orderItemId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "order_item_id",   
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
    modelName: "OrderItem",     
    tableName: "order_items",    
    timestamps: false,           
  }
);
export default OrderItem;