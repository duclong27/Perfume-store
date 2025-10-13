import { Model, DataTypes } from "sequelize"
import { sequelize } from "../config/sequelize.js"


class Address extends Model { }

Address.init(
  {
    addressId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "address_id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    recipientName: {
      type: DataTypes.STRING(100),
      field: "recipient_name",
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      field: "phone_number",
    },
    addressLine: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "address_line",
    },
    city: {
      type: DataTypes.STRING(100),
    },
    state: {
      type: DataTypes.STRING(100),
    },
    postalCode: {
      type: DataTypes.STRING(20),
      field: "postal_code",
    },
    country: {
      type: DataTypes.STRING(100),
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_default",
    },
  },
  {
    sequelize,
    modelName: "Address",
    tableName: "addresses",
    timestamps: false, // bảng này không có created_at/updated_at
  }
);
export default Address;