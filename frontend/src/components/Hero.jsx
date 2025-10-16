
import { assets } from '../assets/assets'

import React, { useContext, useEffect, useState } from 'react';
import { Link } from "react-router-dom";




const Hero = () => {
    const product = {
        id: 20,
        name: "Dark Summer",
        tagline: " Outstading product ",
        priceFormatted: "SALE OF 20%",
        image: [assets.dark_summer],
        rating: 5, 
    };

    return (

        <div>
            {/* Title block */}
            <div className="mt-16 mb-6 text-center">
                <h2 className="text-3xl lora-regular sm:text-6xl font-bold text-black">
                    Key Product
                </h2>
            </div>

            <div
                id="Hero"
                className="flex  flex-col sm:flex-row border border-gray-400 mt-20
                        rounded-2xl p-4 sm:p-6 bg-black/80 ">


                {/* LEFT: Ảnh sản phẩm */}
                <div className="w-full sm:w-1/2">
                    <div className="relative overflow-hidden rounded-xl border border-white/10
                                bg-neutral-900/70 w-full  flex items-center justify-center  ">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="max-h-full  object-contain transition-transform duration-500 hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]" />
                    </div>
                </div>

                {/* RIGHT: Thông tin & CTA */}
                <div className="w-full sm:w-1/2 sm:pl-8 pt-6 sm:pt-0 flex flex-col justify-center text-white gap-4">
                    <h1 className="text-8xl   leading-tight">{product.name}</h1>
                    <p className="text-white/70 text-2xl sm:text-lg">{product.tagline}</p>

                    <div className="flex items-center gap-3">
                        <span className="text-5xl font-semibold">{product.priceFormatted}</span>
                        <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                    key={i}
                                    viewBox="0 0 20 20"
                                    className={`w-5 h-5 ${i < product.rating ? "text-yellow-400" : "text-white/20"}`}
                                    fill="currentColor"
                                >
                                    <path d="M10 15.27l-5.18 3.05 1.4-5.99L1 7.97l6.09-.52L10 2l2.91 5.45 6.09.52-5.22 4.36 1.4 5.99z" />
                                </svg>
                            ))}
                        </div>
                    </div>

                    <Link
                        to={`/product/${product.id}`}
                        className=" mt-9 text-center text-3xl rounded-full px-3  py-7 bg-neutral-800 text-white border border-white/10 shadow-md hover:shadow-xl hover:border-white/20 transition">
                        View details
                    </Link>


                </div>

            </div>
        </div>

    );
};

export default Hero;
