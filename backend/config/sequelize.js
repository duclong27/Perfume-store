// config/sequelize.js
import { Sequelize, UniqueConstraintError } from "sequelize";
import "dotenv/config";

export const sequelize = new Sequelize(process.env.DATABASE_URLSECOND, {
  dialect: "mysql",
  logging: false,
});


export { UniqueConstraintError };
