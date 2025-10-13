// import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'            // ✅ import App
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import ShopContextProvider from './context/ShopContext';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';

// import CSS 



// import React 

ReactDOM.createRoot(document.getElementById('root')).render(
   <BrowserRouter>
      <AuthProvider>
         <CartProvider>
            <ShopContextProvider>
               <App />
            </ShopContextProvider>
         </CartProvider>
      </AuthProvider>
   </BrowserRouter>
)
