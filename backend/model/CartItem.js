import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

class CartItem extends Model { }

CartItem.init(
  {
    cartItemId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "cart_item_id",
    },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "cart_id",
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "variant_id",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPriceSnapshot: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // cho phép null để dễ backfill dữ liệu
      field: "unit_price_snapshot",
      comment: "Unit price captured when item was added to cart",
    },
  },
  {
    sequelize,
    modelName: "CartItem",
    tableName: "cart_items",
    timestamps: false,
  }
);

export default CartItem;
