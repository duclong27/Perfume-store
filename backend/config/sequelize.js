// config/sequelize.js
import { Sequelize, UniqueConstraintError } from "sequelize";
import "dotenv/config";

// Validate DATABASE_URLSECOND exists
if (!process.env.DATABASE_URLSECOND) {
  console.error("❌ DATABASE_URLSECOND environment variable is not set");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URLSECOND;
const isProduction = process.env.NODE_ENV === "production";

// Parse connection string để hỗ trợ cả URL format và object format
let sequelizeConfig;

// Kiểm tra xem có phải là URL format không (mysql://...)
if (databaseUrl.startsWith("mysql://") || databaseUrl.startsWith("mysql2://")) {
  // Sequelize tự động parse URL, nhưng cần thêm SSL config
  sequelizeConfig = {
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    timezone: "+07:00",
    dialectOptions: {
      // SSL configuration cho Render MySQL (bắt buộc trong production)
      ssl: isProduction
        ? {
            require: true,
            rejectUnauthorized: false, // Render dùng self-signed certificates
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
  };
} else {
  // Nếu không phải URL format, Sequelize sẽ parse như object
  sequelizeConfig = {
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    timezone: "+07:00",
    dialectOptions: {
      ssl: isProduction
        ? {
            require: true,
            rejectUnauthorized: false,
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
  };
}

export const sequelize = new Sequelize(databaseUrl, sequelizeConfig);

export { UniqueConstraintError };
