import React from 'react'
import Hero from '../components/Hero'
import { assets } from '../assets/assets'


import Home_only from '../components/Home_only';
import LatestCollection from '../components/LatestCollection';
import BestSeller from '../components/BestSeller';
import OurPolicy from '../components/OurPolicy';
import NewsletterBox from '../components/NewsletterBox';
import Footer from '../components/Footer';
import AboutSectionBootstrap from '../components/AboutSectionBootstrap';





// Import assets

const Home = () => {
  return (
    <div>

      <Home_only />

      <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] ">
        <Hero />
        <LatestCollection />
        <BestSeller />
        <OurPolicy />
        <NewsletterBox />
        

      </div>

















    </div>



  )
}

export default Home