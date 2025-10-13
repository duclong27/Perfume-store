import { loginCustomerService, registerUserService } from "../../service/customer/authService.js";



export const registerUserController = async (req,res) =>{
        try{
            const {name,email,password} = req.body || {};
            const {token}  = await registerUserService({name, email, password});
            return res.status(201).json({success: true, token});
        }
        catch(err){
            const status = err.status || 500;
            console.error("Register error:", err);
            return res.status(status).json({
            success: false,
            message: err.message || "Server error during register",
         });
        }
    }




export const loginCustomerController = async (req, res, next) => {
  try {
    const { email = "", password = "" } = req.body || {};
    const { token, user } = await loginCustomerService({ email, password });
    return res.status(200).json({ success: true, token, user });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    let message = "Server error during login";

    if (status === 401) message = "Invalid email or password";
    if (status === 403) message = err.message || "No way";
    if (status === 404) message = "Invalid email or password"; // tránh lộ user tồn tại

    console.error("Login customer error:", err);
    return res.status(status).json({ success: false, message });
  }
};