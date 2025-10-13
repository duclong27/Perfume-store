import { Model, DataTypes } from "sequelize";
import {sequelize} from "../config/sequelize.js"

 class Category extends Model {}

Category.init(
  {
    categoryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "category_id",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique : true,
      field: "name",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "description",
    },
  },
  {
    sequelize,
    modelName: "Category",     // tên model trong code
    tableName: "categories",   // tên bảng trong DB
    timestamps: false,         // bảng không có created_at/updated_at
  }
);

export default Category;
