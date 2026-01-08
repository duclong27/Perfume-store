// config/sequelize.js
import { Sequelize, UniqueConstraintError } from "sequelize";
import "dotenv/config";

// Validate DATABASE_URLSECOND exists
if (!process.env.DATABASE_URLSECOND) {
  console.error("❌ DATABASE_URLSECOND environment variable is not set");
  process.exit(1);
}

// Parse DATABASE_URLSECOND to check if SSL is needed (for Render)
const databaseUrl = process.env.DATABASE_URLSECOND;
const isProduction = process.env.NODE_ENV === "production";

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "mysql",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  timezone: "+07:00", // Vietnam timezone
  dialectOptions: {
    // SSL configuration for Render MySQL
    ssl: isProduction
      ? {
          require: true,
          rejectUnauthorized: false, // Render uses self-signed certificates
        }
      : false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
  },
});

export { UniqueConstraintError };
