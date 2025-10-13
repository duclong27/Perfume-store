import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

class Role extends Model {}

Role.init(
  {
    roleId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: "role_id" },
    roleName: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: "role_name" },
    description: { type: DataTypes.TEXT },
  },
  {
    sequelize,
    modelName: "Role",
    tableName: "roles",
    timestamps: false, // bảng không có created_at/updated_at
  }
);

export default Role;