import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.js";

class UserRole extends Model {}

UserRole.init(
  {
    userId: { type: DataTypes.INTEGER, primaryKey: true, field: "user_id" },
    roleId: { type: DataTypes.INTEGER, primaryKey: true, field: "role_id" },
  },
  {
    sequelize,
    modelName: "UserRole",
    tableName: "user_roles",
    timestamps: false,
  }
);

export default UserRole;
