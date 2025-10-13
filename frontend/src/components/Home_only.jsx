import React from 'react'
import Hero from './Hero'
import { assets } from '../assets/assets'
import perfume_video from "../assets/perfume_video.mp4";

const Home_only = () => {
  return (
   <div className="w-full">
   
           {/* HERO SECTION với video */}
           <div className="relative w-full h-screen flex items-center justify-center text-center text-white">
   
   
               {/* Video background */}
               <video 
               autoPlay 
               loop 
               muted 
               playsInline 
               className="absolute inset-0 w-full h-full object-cover z-0"
               >
               <source src={perfume_video} type="video/mp4" />
               </video>
   
               {/* Overlay */}
               <div className="absolute inset-0 bg-black/40 z-10"></div>
   
   
               {/* Nội dung */}
               <div className="relative z-20 px-4">
                   <h1 className="text-4xl md:text-6xl font-bold mb-4">
                       Welcome to ARVENA
                   </h1>
                   <p className="text-lg md:text-xl mb-6">
                       Discover the best products for you.
                   </p>
                   <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 cursor-pointer"
                   onClick={() => {
                           document.getElementById("latestCollection")?.scrollIntoView({ behavior: "smooth" });
                   }}
                   
                   >
                       
                      
                       Shop Now
                   </button>
               </div>
   
   
           
           </div>
       </div>






                // <div className="relative w-full h-screen flex items-center justify-center text-center text-white">
                //     {/* Video background */}
                //     <video
                //         autoPlay
                //         loop
                //         muted
                //         playsInline
                //         className="absolute inset-0 w-full h-full object-cover z-0"
                //     >
                //         <source src="/video.mp4" type="video/mp4" />
                //     </video>

                //     {/* Overlay */}
                //     <div className="absolute inset-0 bg-black/40 z-10"></div>

                //     {/* Content */}
                //     <div className="relative z-20 px-4">
                //         <h1 className="text-4xl md:text-6xl font-bold mb-4">
                //         Welcome to ARVENA
                //         </h1>
                //         <p className="text-lg md:text-xl mb-6">
                //         Discover the best products for you.
                //         </p>
                //         <button
                //             onClick={() =>
                //                 document
                //                 .getElementById("Hero")
                //                 ?.scrollIntoView({ behavior: "smooth" })
                //             }
                //             className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 cursor-pointer transition-transform duration-200 hover:scale-105"
                //             >
                //             Shop Now
                //         </button>
                //     </div>
                // </div>
  )
}

export default Home_only