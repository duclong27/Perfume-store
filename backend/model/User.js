import {Model,DataTypes} from "sequelize"
import {sequelize} from "../config/sequelize.js"


class User extends Model{
    static async findByEmail(email){
        return await this.findOne({where :{email}});
    }
}

User.init (
{
     userId:{
        type :DataTypes.INTEGER,
        primaryKey :true,
        autoIncrement : true,
        field:"user_id",
        },
 
    name : {
        type : DataTypes.STRING(100),
        allowNull :false,
        field : "name"
    },
     email : {
        type : DataTypes.STRING(150),
        allowNull :false,
        unique : true,
        validate :{isEmail :true},
        field : "email"
    },

    passwordHash :{
        type : DataTypes.STRING(255),
        allowNull : false ,
        field  : "password_hash"
        
    },
    isEnable : {
        type : DataTypes.BOOLEAN,
        allowNull : false ,
        defaultValue: true,   
        field : "is_enable"
    },
    createdAt :{
        type:DataTypes.DATE,
        field: "created_at",

    },
},
{
     sequelize,
     modelName : "User",
     tableName:"users",
     timestamps :false ,
}
)
export default User;