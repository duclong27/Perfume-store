require ('dotenv').config();
const mysql = require('mysql2/promise')

async function connectDB() {
    try{
     const connection = await mysql.createConnection(process.env.DATABASE_URLSECOND);
     console.log('MySQL connected successfully')
     return connection;
    }catch(err){
    console.error(" Error connection :",err)
    }
}
export default  connectDB;