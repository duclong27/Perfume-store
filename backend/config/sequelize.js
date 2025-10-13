// config/sequelize.js
import { Sequelize, UniqueConstraintError } from "sequelize";
import "dotenv/config";

export const sequelize = new Sequelize(process.env.DATABASE_URLSECOND, {
  dialect: "mysql",
  logging: false,
});

// Export lại cho các file khác có thể dùng
export { UniqueConstraintError };
