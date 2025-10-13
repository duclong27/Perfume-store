import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

class Order extends Model { }




Order.init(
  {
    orderId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "order_id",
    },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
    addressId: { type: DataTypes.INTEGER, allowNull: true, field: "address_id" },

    // Fulfillment status (để giao hàng): giữ như bạn đang dùng
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "paid",       // <— KHÔNG dùng nữa cho thanh toán (giữ để tương thích)
        "shipped",
        "completed",
        "cancelled"
      ),
      defaultValue: "pending",
      field: "status",
    },

    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "total_amount" },
    note: { type: DataTypes.STRING(255), allowNull: true, field: "note" },
    createdAt: { type: DataTypes.DATE, field: "created_at", defaultValue: DataTypes.NOW },

    // Shipping snapshots
    shippingName: { type: DataTypes.STRING(100), allowNull: true, field: "shipping_name" },
    shippingPhone: { type: DataTypes.STRING(20), allowNull: true, field: "shipping_phone" },
    shippingAddress: { type: DataTypes.TEXT, allowNull: true, field: "shipping_address" },
    shippingCity: { type: DataTypes.STRING(100), allowNull: true, field: "shipping_city" },
    shippingState: { type: DataTypes.STRING(100), allowNull: true, field: "shipping_state" },
    shippingPostal: { type: DataTypes.STRING(20), allowNull: true, field: "shipping_postal" },
    shippingCountry: { type: DataTypes.STRING(100), allowNull: true, field: "shipping_country" },

    // ===== NEW: Payment rollup trên Order =====
    paymentMethodCode: {
      type: DataTypes.ENUM("COD", "BANK_TRANSFER", "VNPAY"),
      allowNull: false,
      defaultValue: "COD",
      field: "payment_method_code",
    },
    paymentStatus: {
      type: DataTypes.ENUM("unpaid", "pending", "paid", "failed", "cancelled"),
      allowNull: false,
      defaultValue: "unpaid",
      field: "payment_status",
    },
    paymentInstructionsSnapshot: {
      type: DataTypes.JSON, // MySQL 5.7+
      allowNull: true,
      field: "payment_instructions_snapshot",
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "paid_at",
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    timestamps: false,
  }
);

export default Order;