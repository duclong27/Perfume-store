




import XNavbar from './components/XNavbar';
import { ToastContainer, toast } from "react-toastify";
import Home from './pages/Home';
import Collection from './pages/Collection';
import Footer from './components/Footer';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from "./components/ScrollToTop";
import Product from './pages/Product';
import Cart from './pages/Cart';
import CartTotal from './components/CartTotal';
import React, { useEffect, useState } from "react";
import AboutPage from './pages/About';
import axios from "axios";
import ContactPage from './pages/Contact';
import LoginPage from './pages/Login'
import SignupPage from './pages/SignUp'
import PreviewOrderPage from './pages/PreviewOrder';
import AddressPage from './pages/Address/AddressPage';
import AddAddressPage from './pages/Address/AddAddressPage';
import EditAddressPage from './pages/Address/EditAddressPage';
import { Toaster } from 'react-hot-toast';
import ReturnPage from './pages/ReturnPage'
import SuccessPage from './pages/SuccessPage';
import MyOrderPage from './pages/Orders';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = (apiBaseUrl || "").replace(/\/+$/, ""); // bỏ mọi dấu "/" ở cuối

export const api = axios.create({
  baseURL,
  withCredentials: false,
});
console.log("[API] baseURL =", api.defaults.baseURL);


const App = () => {
  return (



    <>


      <ScrollToTop />
      {/* Navbar full width nhưng nội dung bên trong vẫn căn giữa */}
      <XNavbar />


      {/* Home sẽ là trang được tách riêng */}
      <Routes>
        <Route path="/" element={<Home />} />

      </Routes>


      {/* Phần nội dung chính cũng căn giữa bằng px-... */}
      <div className="px-4 pt-25 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] ">
        <ToastContainer />

        <Routes>
          <Route path="/order/:id/return" element={<ReturnPage />} />
          <Route path="/order/success/:id" element={<SuccessPage />} />
          <Route path="/myOrder" element={<MyOrderPage />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/cartTotal" element={<CartTotal />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contactPage" element={<ContactPage />} />
          <Route path="/loginPage" element={<LoginPage />} />
          <Route path="/signUpPage" element={<SignupPage />} />
          <Route path="/previewOrderPage" element={<PreviewOrderPage />} />
          <Route path="/addressPage" element={<AddressPage />} />
          <Route path="/addAddressPage" element={<AddAddressPage />} />
          <Route path="/editAddressPage/:addressId" element={<EditAddressPage />} />
        </Routes>

      </div>
      <Footer />

    </>
  )
}

export default App                    
