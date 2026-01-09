
import { Sequelize, UniqueConstraintError } from "sequelize";
import "dotenv/config";


if (!process.env.DATABASE_URLSECOND) {
  console.error("❌ DATABASE_URLSECOND environment variable is not set");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URLSECOND;
const isProduction = process.env.NODE_ENV === "production";


let sequelizeConfig;


if (databaseUrl.startsWith("mysql://") || databaseUrl.startsWith("mysql2://")) {
 
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
} else {
  
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
