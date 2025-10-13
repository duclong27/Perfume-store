import logo from './logo.png'
import search_icon from './search_icon.png'
import profile_icon from './profile_icon.png'
import cart_icon from './cart_icon.png'
import dropdown_icon from './dropdown_icon.png'
import menu_icon from './menu_icon.png'
import change_icon from './change_icon.png'
import quality_icon from './quality_icon.png'
import support_icon from './support_icon.png'
import quality_icon2 from './quality_icon2.png'
import quality_icon3 from './quality_icon3.png'
import search_icon2 from './search_icon2.png'
   {/* Video and pictures */}
import perfume_video from './perfume_video.mp4'
import channel_coco from './channel_coco.jpeg'
import hero_pic from './hero_pic.jpeg'
import creedaventus from './creedaventus.jpg'
import dior_sauvage from './dior_sauvage.jpg'
import saintlaurent from './saintlaurent.webp'
import tomford from './tomford.webp'
import hero_pic2 from './hero_pic2.jpg'
import hero_pic3 from './hero_pic3.jpg'
import scuba from './scuba.avif'
import charlie_black from './charlie_black.jpg'
import dark_summer from './dark_summer.jpg'
import sm_perfume from './sm_perfume.avif'
import bleu_channel from './bleu_channel.avif'
import BestSeller from '../components/BestSeller'
import dreamstime_pic from './dreamstime_pic.webp'
import paris_pic from './paris_pic.avif'
import star_icon from './star_icon.png'
import moro_over_gucci from './more_over_gucci.webp'
import duclong from './duclong.jpg'


export const assets={
    logo,
    search_icon,
    profile_icon,
    cart_icon,
    dropdown_icon,
    menu_icon,
    hero_pic,
    perfume_video,
    hero_pic2, 
    hero_pic3,
    scuba,
    charlie_black,
    dark_summer,sm_perfume,
    bleu_channel, 
    change_icon,
    quality_icon,
    support_icon,
    quality_icon2,
    quality_icon3,
    search_icon2, 
    dreamstime_pic,
    paris_pic,
    star_icon,
    duclong


    
}

export const products = [
//   {
//     id: 1,
//     category_id: 101,
//     name: "Dior Sauvage Eau de Toilette",
//     brand: "Dior",
//     sku: "DIOR-SV-EDT-100",
//     price: 2500.00,
//     stock: 50,
//     subCategory: 100,
//     fragrance_notes: "Floral",
//     gender: "Men",
//     image: [dior_sauvage],
//     description: "Một hương gỗ tươi mát, cay nồng và nam tính, ra mắt 2015.",
//     created_at: "2024-08-20T10:00:00Z",
//     bestseller :true

//   },
//   {
//     id: 2,
//     category_id: 102,
//     name: "Chanel Coco Mademoiselle Eau de Parfum",
//     brand: "Chanel",
//     sku: "CHANEL-CM-EDP-50",
//     price: 3200.00,
//     stock: 30,
//     subCategory: 50,
//     fragrance_notes: "Floral",
//     gender: "Woman",
//     image: [scuba],
//     description: "Một hương hoa cỏ – phương Đông quyến rũ và tinh tế, dành cho phái nữ hiện đại.",
//     created_at: "2024-08-19T15:30:00Z",
//     bestseller :true
//   },
//   {
//     id: 3,
//     category_id: 103,
//     name: "Creed Aventus",
//     brand: "Creed",
//     sku: "CREED-AV-100",
//     price: 7800.00,
//   stock: 20,
//     subCategory: 100,
//     fragrance_notes: "Pineapple",
//     gender: "Man",
//     image: [creedaventus],
//     description: "Mùi hương huyền thoại với sự kết hợp trái cây và gỗ, được ưa chuộng toàn cầu.",
//     created_at: "2024-08-18T09:45:00Z",
//     bestseller :true
//   },
//   {
//     id: 4,
//     category_id: 104,
//     name: "Tom Ford Black Orchid",
//     brand: "Tom Ford",
//     sku: "TF-BO-EDP-100",
//     price: 4500.00,
//     stock: 40,
//     subCategory: 100,
//     fragrance_notes: "Pineapple",
//     gender: "Unisex",
//     image: [creedaventus],
//     description: "Một hương thơm sang trọng, huyền bí và đầy quyền lực, phù hợp cả nam và nữ.",
//     created_at: "2024-08-17T13:20:00Z"
//   },
//   {
//     id: 5,
//     category_id: 105,
//     name: "YSL Libre Eau de Parfum",
//     brand: "Yves Saint Laurent",
//     sku: "YSL-LIBRE-EDP-90",
//     price: 2900.00,
//     stock: 25,
//     subCategory: 90,
//     fragrance_notes: "Wood",
//     gender: "Woman",
//     image: [dior_sauvage],
//     description: "Sự tự do hiện đại trong một mùi hương hoa cỏ phương Đông, nữ tính và cá tính.",
//     created_at: "2024-08-16T11:10:00Z"
//   },
//   {
//     id: 6,
//     category_id: 106,
//     name: "YSL Libre Eau de Parfum",
//     brand: "Yves Saint Laurent",
//     sku: "YSL-LIBRE-EDP-90",
//     price: 2900.00,
//     stock: 25,
//     subCategory: 90,
//     fragrance_notes: "Wood",
//     gender: "Woman",
//     image: [bleu_channel],
//     description: "Sự tự do hiện đại trong một mùi hương hoa cỏ phương Đông, nữ tính và cá tính.",
//     created_at: "2024-08-16T11:10:00Z"
//   },

{
    id: 1,
    category_id: 1,
    name: "Citrus Dawn",
    brand: "AromaLab",
    fragrance_notes: "Bergamot, Lemon Zest, Neroli, White Musk",
    gender: "Unisex",
    image: [moro_over_gucci],
    description: "Hương cam chanh tươi sáng cho ngày mới.",
    bestSeller:true,
    variants: [
      { variant_id: 101, capacity_ml: 50, sku: "CTD-50", price: 590, stock: 80 },
     
      { variant_id: 103, capacity_ml: 150, sku: "CTD-150", price: 1950, stock: 20 },
    ]
  },
  {
    id: 2,
    category_id: 1,
    name: "Midnight Oud",
    brand: "Nocturne",
    fragrance_notes: "Oud, Saffron, Rose, Amber",
    gender: "Man",
    image: [scuba],
    description: "Mùi trầm hương sâu lắng và bí ẩn.",
    bestSeller:true,
    variants: [
      { variant_id: 201, capacity_ml: 50, sku: "MNO-50", price: 1150, stock: 35 },
      
      { variant_id: 203, capacity_ml: 150, sku: "MNO-150", price: 1950, stock: 15 },
    ]
  },
  {
    id: 3,
    category_id: 2,
    name: "Velvet Peony",
    brand: "Florique",
    fragrance_notes: "Peony, Raspberry, Vanilla, Musk",
    gender: "Woman",
    image: [creedaventus],
    description: "Hoa mẫu đơn mượt như nhung, ngọt ngào.",
    bestSeller:false,
    variants: [
      { variant_id: 301, capacity_ml: 50, sku: "VLP-50", price: 690, stock: 75 },
      { variant_id: 302, capacity_ml: 100, sku: "VLP-100", price: 1100, stock: 30 },
      { variant_id: 303, capacity_ml: 150, sku: "VLP-150", price: 1500, stock: 12 }
    ]
  },
  {
    id: 4,
    category_id: 2,
    name: "Sea Mist",
    brand: "Azure",
    fragrance_notes: "Sea Salt, Driftwood, Lime, Musk",
    gender: "Unisex",
    image: [creedaventus],
    description: "Cảm hứng biển khơi mát lành.",
    bestSeller:false,
    variants: [
      { variant_id: 401, capacity_ml: 50, sku: "SEM-50", price: 450, stock: 10 },
      { variant_id: 402, capacity_ml: 100, sku: "SEM-100", price: 1450, stock: 10 },
      
    ]
  },
  {
    id: 5,
    category_id: 1,
    name: "Amber Trail",
    brand: "Nomad",
    fragrance_notes: "Amber, Cedar, Cardamom, Leather",
    gender: "Man",
    image: [dior_sauvage],
    description: "Hổ phách ấm áp và gỗ thơm.",
    bestSeller:false,
    variants: [
      { variant_id: 501, capacity_ml: 50, sku: "AMT-50", price: 820, stock: 45 },
      { variant_id: 502, capacity_ml: 100, sku: "AMT-100", price: 1350, stock: 20 },
      { variant_id: 503, capacity_ml: 150, sku: "AMT-150", price: 1750, stock: 10 }
    ]
  },
  {
    id: 6,
    category_id: 2,
    name: "Jasmine Whisper",
    brand: "Bloom",
    fragrance_notes: "Jasmine, Green Tea, Pear, Musk",
    gender: "Woman",
    image: [bleu_channel],
    description: "Hương nhài nhẹ nhàng, thanh thoát.",
    bestSeller:true,
    variants: [
      { variant_id: 601, capacity_ml: 50, sku: "JSW-50", price: 620, stock: 100 },
    
      { variant_id: 603, capacity_ml: 150, sku: "JSW-150", price: 1400, stock: 18 }
    ]
  },
  {
    id: 7,
    category_id: 1,
    name: "Cedar Snow",
    brand: "Northline",
    fragrance_notes: "Cedarwood, Iris, Alpine Air, Ambergris",
    gender: "Unisex",
    image: [bleu_channel],
    description: "Gỗ tuyết tùng thanh sạch như tuyết.",
    bestSeller:true,
    variants: [
      { variant_id: 703, capacity_ml: 50, sku: "CDS-50", price: 800, stock: 12 },
 
      { variant_id: 705, capacity_ml: 150, sku: "CDS-150", price: 1300, stock: 12 },
    ]
  },
  {
    id: 8,
    category_id: 2,
    name: "Dark Summer",
    brand: "Parfum",
    fragrance_notes: "Cedarwood, Iris, Alpine Air, Ambergris",
    gender: "Unisex",
    image: [dark_summer],
    description: "Lạnh hơn bắc cực.",
    bestSeller:false,
    variants: [
      { variant_id: 803, capacity_ml: 50, sku: "DS-50", price: 1600, stock: 12 },
      { variant_id: 804, capacity_ml: 100, sku: "DS-100", price: 2600, stock: 17 }
     
    ]
  }

];

