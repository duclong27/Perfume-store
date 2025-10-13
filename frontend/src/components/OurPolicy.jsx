
import React from 'react'
import { assets } from '../assets/assets'
const OurPolicy = () =>  {
  return (
  <div className="flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-gray-700">
    <div>
      <img src={assets.change_icon} className="w-12 m-auto mb-5" alt="" />
      <p className="text-lg md:text-xl font-semibold">Easy Exchange Policy</p>
      <p className="text-sm md:text-base text-gray-400">
        We offer hassle free exchange policy
      </p>
    </div>

    <div>
      <img src={assets.quality_icon3} className="w-14 m-auto mb-5" alt="" />
      <p className="text-lg md:text-xl font-semibold">Premium Quality</p>
      <p className="text-sm md:text-base text-gray-400">
        We ensure the best product quality
      </p>
    </div>

    <div>
      <img src={assets.support_icon} className="w-12 m-auto mb-5" alt="" />
      <p className="text-lg md:text-xl font-semibold">24/7 Support</p>
      <p className="text-sm md:text-base text-gray-400">
        Our team is always here to help
      </p>
    </div>
  </div>
);
}

export default OurPolicy