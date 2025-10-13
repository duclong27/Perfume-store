import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

class Cart extends Model {}

Cart.init(
  {
    cartId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "cart_id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
  },
  {
    sequelize,
    modelName: "Cart",
    tableName: "carts",
    timestamps: false, // bảng chỉ có created_at
  }
);

export default Cart;
