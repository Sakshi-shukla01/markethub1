/**
 * Seeds the database with categories, an admin, demo users, and sample products.
 * Run with:  npm run seed
 *
 * Product images: if UNSPLASH_ACCESS_KEY is set in the env, each product gets a
 * REAL photo that matches its title (fetched from the Unsplash API using a
 * hand-picked search term per item). If the key is missing, it falls back to
 * keyword-matched LoremFlickr photos so the seed still works with zero setup.
 * Get a free key at https://unsplash.com/developers
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

const categories = [
  { name: 'Electronics', slug: 'electronics', icon: '📱' },
  { name: 'Vehicles', slug: 'vehicles', icon: '🚗' },
  { name: 'Furniture', slug: 'furniture', icon: '🛋️' },
  { name: 'Fashion', slug: 'fashion', icon: '👕' },
  { name: 'Mobiles', slug: 'mobiles', icon: '📞' },
  { name: 'Books', slug: 'books', icon: '📚' },
  { name: 'Sports', slug: 'sports', icon: '⚽' },
  { name: 'Home Appliances', slug: 'home-appliances', icon: '🍳' },
];

// Each product has a `query` = the exact search term used to fetch a matching photo.
const productSeed = [
  // MOBILES
  { title: 'iPhone 13 - 128GB Midnight', query: 'iphone 13', description: 'Excellent condition iPhone 13, 128GB, battery health 91%. No scratches, original box and charger included.', price: 42000, category: 'Mobiles', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'Samsung Galaxy S23 Ultra', query: 'samsung galaxy phone', description: 'Galaxy S23 Ultra 256GB, Phantom Black. 1 year old, with S-Pen, box, and screen guard applied.', price: 68000, category: 'Mobiles', condition: 'used', location: 'Mumbai, Maharashtra' },
  { title: 'OnePlus 11R 5G 256GB', query: 'oneplus smartphone', description: 'OnePlus 11R, 16GB RAM, 256GB. 8 months old, flawless condition with warranty remaining.', price: 32000, category: 'Mobiles', condition: 'used', location: 'Delhi' },
  { title: 'Oppo Reno 8 Pro', query: 'oppo smartphone', description: 'Oppo Reno 8 Pro, Glazed Green, 12GB/256GB. Great camera phone, gently used, no dents.', price: 24000, category: 'Mobiles', condition: 'used', location: 'Nagpur, Maharashtra' },
  { title: 'Redmi Note 13 Pro+', query: 'xiaomi smartphone', description: 'Redmi Note 13 Pro+ 5G, 200MP camera, 8GB/256GB. Sealed pack, brand new, unwanted gift.', price: 27000, category: 'Mobiles', condition: 'new', location: 'Pune, Maharashtra' },

  // ELECTRONICS
  { title: 'MacBook Air M2 2023', query: 'macbook laptop', description: 'M2 MacBook Air, 8GB RAM, 256GB SSD. Lightly used for college, mint condition.', price: 78000, category: 'Electronics', condition: 'used', location: 'Mumbai, Maharashtra' },
  { title: 'Sony WH-1000XM4 Headphones', query: 'headphones', description: 'Industry-leading noise cancellation. Barely used, comes with carrying case and cable.', price: 18000, category: 'Electronics', condition: 'used', location: 'Bengaluru, Karnataka' },
  { title: 'Samsung 43" 4K Smart TV', query: 'smart television', description: 'Crystal UHD 4K TV, 6 months old with full warranty. Selling to upgrade to a larger screen.', price: 28000, category: 'Electronics', condition: 'used', location: 'Hyderabad, Telangana' },
  { title: 'Gaming PC RTX 3060', query: 'gaming pc computer', description: 'Custom build: Ryzen 5 5600, RTX 3060, 16GB DDR4, 1TB NVMe. Runs everything maxed out.', price: 65000, category: 'Electronics', condition: 'used', location: 'Bengaluru, Karnataka' },
  { title: 'iPad Air 5th Gen 64GB', query: 'ipad tablet', description: 'iPad Air M1 chip, Wi-Fi, Space Grey. With Apple Pencil 2. Perfect for notes and sketching.', price: 38000, category: 'Electronics', condition: 'used', location: 'Pune, Maharashtra' },

  // VEHICLES
  { title: 'Royal Enfield Classic 350', query: 'royal enfield motorcycle', description: '2021 model, 12000 km driven, single owner, all papers clear. Recently serviced.', price: 145000, category: 'Vehicles', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'Honda Activa 6G', query: 'scooter', description: '2022 Honda Activa 6G, 9000 km, excellent mileage, new tyres. Smooth ride, well maintained.', price: 62000, category: 'Vehicles', condition: 'used', location: 'Mumbai, Maharashtra' },
  { title: 'Maruti Suzuki Swift VXi', query: 'hatchback car', description: '2019 Swift VXi, petrol, 45000 km, second owner. Insurance valid, no accidents. Family car.', price: 480000, category: 'Vehicles', condition: 'used', location: 'Nashik, Maharashtra' },
  { title: 'Hero Splendor Plus', query: 'commuter motorcycle', description: 'Hero Splendor Plus 2020, 18000 km, single owner. Best commuter bike, 60+ kmpl mileage.', price: 48000, category: 'Vehicles', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'Bajaj Pulsar NS200', query: 'sport motorcycle', description: '2021 Pulsar NS200, 15000 km, ABS, aftermarket exhaust. Sporty and powerful. Papers clear.', price: 95000, category: 'Vehicles', condition: 'used', location: 'Bengaluru, Karnataka' },

  // FURNITURE
  { title: 'Wooden Study Table', query: 'wooden desk', description: 'Solid sheesham wood study table with two drawers. Sturdy and spacious, ideal for WFH.', price: 4500, category: 'Furniture', condition: 'used', location: 'Nagpur, Maharashtra' },
  { title: 'IKEA 3-Seater Sofa', query: 'sofa couch', description: 'Grey fabric 3-seater sofa, very comfortable. Minor wear, priced to sell quickly.', price: 12000, category: 'Furniture', condition: 'used', location: 'Mumbai, Maharashtra' },
  { title: 'Queen Size Bed with Storage', query: 'bedroom bed', description: 'Engineered wood queen bed with hydraulic storage. Mattress included. 2 years old.', price: 15000, category: 'Furniture', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'Ergonomic Office Chair', query: 'office chair', description: 'High-back mesh office chair with lumbar support and adjustable armrests. Like new.', price: 6500, category: 'Furniture', condition: 'used', location: 'Hyderabad, Telangana' },
  { title: 'Wooden Bookshelf 5-Tier', query: 'bookshelf', description: 'Tall 5-shelf wooden bookshelf, holds 100+ books. Solid and stable, easy to dismantle.', price: 3800, category: 'Furniture', condition: 'used', location: 'Pune, Maharashtra' },

  // FASHION
  { title: 'Nike Air Force 1 (UK 9)', query: 'white sneakers', description: 'Brand new, never worn. Bought wrong size. Classic white colorway, authentic.', price: 6500, category: 'Fashion', condition: 'new', location: 'Pune, Maharashtra' },
  { title: "Men's Leather Jacket (L)", query: 'leather jacket', description: 'Genuine leather biker jacket, size L. Worn twice. Premium quality, deep brown.', price: 3500, category: 'Fashion', condition: 'used', location: 'Pune, Maharashtra' },
  { title: "Levi's 511 Slim Jeans (32)", query: 'blue jeans denim', description: "Levi's 511 slim fit jeans, waist 32, dark wash. Worn a few times, like new.", price: 1800, category: 'Fashion', condition: 'used', location: 'Mumbai, Maharashtra' },
  { title: 'Ray-Ban Aviator Sunglasses', query: 'sunglasses', description: 'Original Ray-Ban Aviator, gold frame, green lens. With case and cloth. Authentic.', price: 5500, category: 'Fashion', condition: 'used', location: 'Delhi' },
  { title: 'Adidas Backpack 30L', query: 'backpack', description: 'Adidas 30L backpack, water resistant, laptop compartment. Barely used, great for college.', price: 1500, category: 'Fashion', condition: 'used', location: 'Pune, Maharashtra' },

  // BOOKS
  { title: 'GATE CSE Preparation Books', query: 'stack of books study', description: 'Full set of GATE CSE standard books + handwritten notes. Helped me crack GATE with a good rank.', price: 2500, category: 'Books', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'Harry Potter Complete Box Set', query: 'books shelf', description: 'All 7 Harry Potter books, paperback box set. Read once, excellent condition.', price: 3200, category: 'Books', condition: 'used', location: 'Bengaluru, Karnataka' },
  { title: 'JEE Main & Advanced Books', query: 'textbooks library', description: 'Complete JEE prep set: Physics, Chemistry, Maths + previous year papers. Lightly marked.', price: 2800, category: 'Books', condition: 'used', location: 'Kota, Rajasthan' },
  { title: 'Atomic Habits by James Clear', query: 'open book reading', description: 'Bestselling self-help book, hardcover. Like new, no markings. Life-changing read.', price: 350, category: 'Books', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'Fiction Novel Collection (10 books)', query: 'novels books', description: 'Bundle of 10 popular fiction novels — thrillers and classics. Great value for readers.', price: 1200, category: 'Books', condition: 'used', location: 'Mumbai, Maharashtra' },

  // SPORTS
  { title: 'Cricket Kit - Full Set', query: 'cricket bat', description: 'Complete cricket kit with bat, pads, gloves, helmet and kit bag. SS English willow bat.', price: 8000, category: 'Sports', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'Yonex Badminton Racket Pair', query: 'badminton racket', description: 'Two Yonex Nanoray rackets with cover and shuttles. Lightly used, great for beginners.', price: 2200, category: 'Sports', condition: 'used', location: 'Hyderabad, Telangana' },
  { title: 'Nivia Football (Size 5)', query: 'football soccer ball', description: 'Nivia match football, size 5, hand-stitched. Used in a few matches, still in great shape.', price: 700, category: 'Sports', condition: 'used', location: 'Nagpur, Maharashtra' },
  { title: 'Adjustable Dumbbells 20kg', query: 'dumbbells gym', description: 'Pair of adjustable dumbbells up to 20kg with plates. Perfect for home workouts.', price: 3500, category: 'Sports', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'Hero Sprint MTB Bicycle', query: 'mountain bicycle', description: '26" mountain bike, 21-speed gears, disc brakes. 1 year old, smooth ride, well maintained.', price: 9000, category: 'Sports', condition: 'used', location: 'Bengaluru, Karnataka' },

  // HOME APPLIANCES
  { title: 'IFB Microwave Oven 28L', query: 'microwave oven', description: 'IFB convection microwave, 28L. Works perfectly, selling due to relocation. With manuals.', price: 5500, category: 'Home Appliances', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'LG Double Door Refrigerator', query: 'refrigerator', description: 'LG 260L frost-free double door fridge, 3 years old, energy efficient. Cooling perfect.', price: 14000, category: 'Home Appliances', condition: 'used', location: 'Mumbai, Maharashtra' },
  { title: 'Samsung Washing Machine 7kg', query: 'washing machine', description: 'Samsung 7kg fully automatic front load washer. 2 years old, gentle on clothes.', price: 16000, category: 'Home Appliances', condition: 'used', location: 'Pune, Maharashtra' },
  { title: 'Voltas 1.5 Ton Split AC', query: 'air conditioner', description: 'Voltas 1.5 ton 3-star inverter AC, 2 years old. Includes outdoor unit. Cools fast.', price: 22000, category: 'Home Appliances', condition: 'used', location: 'Nashik, Maharashtra' },
  { title: 'Bajaj Mixer Grinder 750W', query: 'kitchen mixer blender', description: 'Bajaj 750W mixer grinder with 3 jars. Lightly used, powerful motor. Great for daily cooking.', price: 1800, category: 'Home Appliances', condition: 'used', location: 'Pune, Maharashtra' },
];

// LoremFlickr fallback (used only if no Unsplash key is set)
let lockCounter = 100;
function fallbackImg(query) {
  lockCounter += 1;
  const kw = query.replace(/\s+/g, ',');
  return `https://loremflickr.com/600/400/${encodeURIComponent(kw)}?lock=${lockCounter}`;
}

// Fetch a real matching photo from Unsplash for a search term.
async function fetchUnsplashImage(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Unsplash ${res.status}`);
  const data = await res.json();
  const photo = data.results && data.results[0];
  if (!photo) throw new Error('no result');
  // append sizing params for a fast, consistent 600x400 image
  return `${photo.urls.raw}&w=600&h=400&fit=crop&q=80`;
}

// Resolve an image URL for a product: Unsplash if key present, else LoremFlickr.
async function resolveImage(query) {
  if (!UNSPLASH_KEY) return fallbackImg(query);
  try {
    return await fetchUnsplashImage(query);
  } catch (e) {
    console.log(`[seed] Unsplash failed for "${query}" (${e.message}) — using fallback`);
    return fallbackImg(query);
  }
}

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('[seed] connected to MongoDB');
  console.log(UNSPLASH_KEY ? '[seed] using Unsplash for matching images' : '[seed] no UNSPLASH_ACCESS_KEY — using LoremFlickr fallback');

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Order.deleteMany({}),
    Wishlist.deleteMany({}),
  ]);
  console.log('[seed] cleared existing data');

  await Category.insertMany(categories);
  console.log(`[seed] inserted ${categories.length} categories`);

  const admin = await User.create({
    name: 'Admin', email: 'admin@markethub.com', password: 'Admin@123', role: 'admin', isVerified: true,
  });
  const alice = await User.create({
    name: 'Alice Sharma', email: 'alice@example.com', password: 'Test@123', isVerified: true, phone: '9876543210',
  });
  const bob = await User.create({
    name: 'Bob Verma', email: 'bob@example.com', password: 'Test@123', isVerified: true, phone: '9123456780',
  });

  // Admin is a pure moderator and owns no listings (separation of duties).
  const sellers = [alice, bob];

  // Resolve a matching image for every product (sequential to respect Unsplash rate limits).
  console.log('[seed] fetching matching images (this may take ~30s)...');
  const products = [];
  for (let i = 0; i < productSeed.length; i++) {
    const p = productSeed[i];
    const imageUrl = await resolveImage(p.query);
    products.push({
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      condition: p.condition,
      location: p.location,
      images: [imageUrl],
      seller: sellers[i % sellers.length]._id,
      status: 'approved',
      views: Math.floor(Math.random() * 200),
    });
    process.stdout.write(`\r[seed] image ${i + 1}/${productSeed.length}`);
  }
  console.log('');

  // make 2 products pending so the admin panel has something to moderate
  products[products.length - 1].status = 'pending';
  products[products.length - 2].status = 'pending';

  await Product.insertMany(products);
  console.log(`[seed] inserted ${products.length} products across ${categories.length} categories (2 pending approval)`);

  console.log('\n========================================');
  console.log('  Seed complete! Login credentials:');
  console.log('  ----------------------------------');
  console.log('  ADMIN  -> admin@markethub.com / Admin@123');
  console.log('  USER   -> alice@example.com   / Test@123');
  console.log('  USER   -> bob@example.com     / Test@123');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] error:', err);
  process.exit(1);
});