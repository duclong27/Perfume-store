import React from 'react'
import { assets } from '../assets/assets'
// const Footer = () =>  {
//   return (
//     <div>
//   {/* Tăng base size + line-height để dễ đọc */}
//   <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-base md:text-lg leading-relaxed">
//     {/* Cột 1 */}
//     <div>
//       <img src={assets.logo} className="mb-5 w-32 md:w-40" alt="Company logo" />
//       {/* Màu chữ đậm hơn 1 chút + size responsive */}
//       <p className="w-full md:w-2/3 text-gray-700">
//         Lorem ipsum dolor sit amet consectetur adipisicing elit. Corporis nobis quam quia
//         molestias dolorum dicta, voluptate dolor officiis ab magni facere quaerat tenetur,
//         sequi fuga.
//       </p>
//     </div>

//     {/* Cột 2 */}
//     <div>
//       {/* Tăng size heading */}
//       <p className="text-2xl md:text-3xl font-semibold mb-5">COMPANY</p>
//       <ul className="flex flex-col gap-1 text-gray-700">
//         <li>Home</li>
//         <li>About us</li>
//         <li>Delivery</li>
//         <li>Privacy Policy</li>
//       </ul>
//     </div>

//     {/* Cột 3 */}
//     <div>
//       <p className="text-2xl md:text-3xl font-semibold mb-5">GET IN TOUCH</p>
//       <ul className="flex flex-col gap-1 text-gray-700">
//         <li><a href="tel:+12124567890" className="hover:underline">+1-212-456-7890</a></li>
//         <li><a href="mailto:info@company.com" className="hover:underline">info@company.com</a></li>
//       </ul>
//     </div>

//     {/* Hàng cuối: cho nhỏ hơn chút vẫn ổn */}
//     <div className="col-span-full">
//       <hr />
//       <p className="py-5 text-sm md:text-base text-center">
//         Copyright 2024@ forever.com - All rights reserved.
//       </p>
//     </div>
//   </div>
// </div>

//   )
// }


// const Footer = () => {
//   return (
//     <div className="bg-black text-white w-full min-h-screen flex flex-col">
//       {/* Wrapper để nội dung không dính mép */}
//       <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] w-full flex-1 flex flex-col">
//         {/* Nội dung chính */}
//         <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 pt-24 pb-8 text-base md:text-lg leading-relaxed">
          
//           {/* Cột 1 */}
//           <div>
//             <img src={assets.logo} className="mb-5 w-32 md:w-40" alt="Company logo" />
//             <p className="w-full md:w-2/3">
//               Lorem ipsum dolor sit amet consectetur adipisicing elit. Corporis nobis quam quia
//               molestias dolorum dicta, voluptate dolor officiis ab magni facere quaerat tenetur,
//               sequi fuga.
//             </p>
//           </div>

//           {/* Cột 2 */}
//           <div>
//             <p className="text-2xl md:text-3xl font-semibold mb-5">COMPANY</p>
//             <ul className="flex flex-col gap-1">
//               <li>Home</li>
//               <li>About us</li>
//               <li>Delivery</li>
//               <li>Privacy Policy</li>
//             </ul>
//           </div>

//           {/* Cột 3 */}
//           <div>
//             <p className="text-2xl md:text-3xl font-semibold mb-5">GET IN TOUCH</p>
//             <ul className="flex flex-col gap-1">
//               <li>
//                 <a href="tel:+12124567890" className="hover:underline">
//                   +1-212-456-7890
//                 </a>
//               </li>
//               <li>
//                 <a href="mailto:info@company.com" className="hover:underline">
//                   info@company.com
//                 </a>
//               </li>
//             </ul>
//           </div>
//         </div>


        
//         {/* Đáy footer: luôn đẩy xuống cuối màn hình */}
//         <div className="mt-auto">
//           <hr className="border-gray-700" />
//           <p className="py-5 text-sm md:text-base text-center">
//             Copyright 2024@ forever.com - All rights reserved.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };


const Footer = () => {
  return (
    <div className="bg-black text-white w-full min-h-screen flex flex-col">
      {/* Wrapper */}
      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] w-full flex-1 flex flex-col">
        
        {/* Nội dung chính */}
        <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 pt-24 pb-8 text-base md:text-lg leading-relaxed">
          
          {/* Cột 1 */}
          <div>
            {/* <img src={assets.logo} className="mb-5 w-32 md:w-40" alt="Company logo" /> */}
            <p className="w-full md:w-2/3">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Corporis nobis quam quia
              molestias dolorum dicta, voluptate dolor officiis ab magni facere quaerat tenetur,
              sequi fuga.
            </p>
          </div>

          {/* Cột 2 */}
          <div>
            <p className="text-2xl md:text-3xl font-semibold mb-5">COMPANY</p>
            <ul className="flex flex-col gap-1">
              <li>Home</li>
              <li>About us</li>
              <li>Delivery</li>
              <li>Privacy Policy</li>
            </ul>
          </div>

          {/* Cột 3 */}
          <div>
            <p className="text-2xl md:text-3xl font-semibold mb-5">GET IN TOUCH</p>
            <ul className="flex flex-col gap-1">
              <li>
                <a href="tel:+12124567890" className="hover:underline">
                  +84-372-590-450
                </a>
              </li>
              <li>
                <a href="mailto:info@company.com" className="hover:underline">
                  arvena@company.com
                </a>
              </li>
            </ul>
          </div>

          {/* Logo thương hiệu lớn - hàng mới */}
          <div className="col-span-full mt-10">
            <div className="w-10/12 mx-auto">
              <img
                src={assets.logo}
                alt="Big brand logo"
                className="w-full h-72 sm:h-80 md:h-96 lg:h-[28rem] object-contain"
              />
            </div>
          </div>
        </div>

        {/* Đáy footer */}
        <div className="mt-auto">
          <hr className="border-gray-700" />
          <p className="py-5 text-sm md:text-base text-center">
            Copyright 2024@ arvena.com - All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};




export default Footer