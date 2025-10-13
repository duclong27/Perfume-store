import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

class Payment extends Model {}

Payment.init(
  {
    paymentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "payment_id",   // ánh xạ tới cột DB
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "order_id",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "amount",
    },
    paymentMethod: {
      type: DataTypes.ENUM("credit_card", "paypal", "cod", "bank_transfer"),
      allowNull: false,
      field: "payment_method",
    },
    status: {
      type: DataTypes.ENUM("pending", "success", "failed"),
      defaultValue: "pending",
      field: "status",
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "paid_at",
    },
    providerTxnId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "provider_txn_id",
    },
  },
  {
    sequelize,
    modelName: "Payment",
    tableName: "payments",
    timestamps: false,
  }
);
export default Payment;