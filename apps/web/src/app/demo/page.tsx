"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { MessageCard, StreamingDropdown } from "../../components/messageCard"
import { UnderstandingCard } from "../../components/UnderstandingCard"
import { ClarifyingQuestion } from "../../components/ClarifyingQuestion"
import { FeatureReviewCard } from "../../components/FeatureReviewCard"
import { TestResultsCard } from "../../components/TestResultsCard"
import { QualityScoreCard } from "../../components/QualityScoreCard"
import { BGPattern } from "../../components/ui/bg-pattern"
import { Collapse } from "../../components/Collapse"
import type { Message } from "../../hooks/useWebSocket"
import {
  Sparkles,
  Zap,
  Code2,
  CheckCircle2,
  Circle,
  Check,
  ChevronRight,
  Shield,
  RotateCcw,
  Menu,
} from "lucide-react"
import { Sidebar } from "../../components/sidebar"

// ── Lazy load IDEModal ──────────────────────────────────────
const IDEModal = dynamic(
  () => import("../../components/IDEModal").then((mod) => mod.IDEModal),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-2 text-[12px] text-white/60">
          Loading IDE...
        </div>
      </div>
    ),
  }
)

// ════════════════════════════════════════════════════════════════
// MOCK ECOMMERCE CODE — Complete, Working Application
// ════════════════════════════════════════════════════════════════

const FRONTEND_FILES: Record<string, string> = {
  "package.json": `{
  "name": "ecommerce-platform",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "vite": "^5.2.12"
  }
}`,

  "vite.config.js": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})`,

  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#C8A96E',
      },
    },
  },
  plugins: [],
}`,

  "postcss.config.js": `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,

  "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NOIR — E-Commerce</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,

  "src/main.jsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,

  "src/App.jsx": `import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import Header from './components/Header'
import Home from './pages/Home'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'

export const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [notification, setNotification] = useState(null)

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setNotification(product.name + ' added to cart')
    setTimeout(() => setNotification(null), 2000)
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount, notification }}>
      {children}
    </CartContext.Provider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen bg-white text-black">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
          <footer className="border-t border-gray-200 py-12 text-center">
            <p className="text-sm text-gray-400 tracking-widest uppercase">&copy; 2024 NOIR. All rights reserved.</p>
          </footer>
        </div>
      </CartProvider>
    </BrowserRouter>
  )
}`,

  "src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --accent: #C8A96E;
  --accent-hover: #B8964E;
  --accent-light: #F5EFE0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.accent-gradient {
  background: linear-gradient(135deg, var(--accent) 0%, #E6B33E 100%);
}

.hero-gradient {
  background: linear-gradient(180deg, #000000 0%, #1a1a1a 100%);
}

.product-hover {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d1d1d1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #aaa; }`,

  "src/components/Header.jsx": `import { Link, useLocation } from 'react-router-dom'
import { useContext, useState } from 'react'
import { CartContext } from '../App'

export default function Header() {
  const { cartCount, notification } = useContext(CartContext)
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Shop' },
    { path: '/cart', label: 'Cart' },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-[0.25em] uppercase">
            NOIR
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={"text-sm font-medium tracking-wider uppercase transition-colors " +
                  (location.pathname === link.path ? "text-[var(--accent)]" : "text-gray-400 hover:text-white")}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative group">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[var(--accent)] transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--accent)] text-black text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                }
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-800 px-6 py-4 space-y-3">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium tracking-wider uppercase text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-black text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}
    </>
  )
}`,

  "src/components/Hero.jsx": `import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="hero-gradient text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(200,169,110,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(200,169,110,0.2) 0%, transparent 50%)'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 md:py-36 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[var(--accent)] text-sm font-semibold tracking-[0.3em] uppercase mb-4">
              New Collection 2024
            </p>
            <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6">
              Timeless<br />
              <span className="text-[var(--accent)]">Elegance</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
              Discover our curated collection of premium products.
              Minimalist design meets exceptional quality.
            </p>
            <div className="flex gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 accent-gradient text-black px-8 py-4 text-sm font-bold tracking-wider uppercase hover:opacity-90 transition-opacity"
              >
                Shop Now
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 border border-gray-600 text-white px-8 py-4 text-sm font-bold tracking-wider uppercase hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                Explore
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center border border-gray-700/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="relative text-center p-8">
                <div className="w-32 h-32 mx-auto mb-6 border-2 border-[var(--accent)]/30 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-[var(--accent)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <p className="text-[var(--accent)] text-xs tracking-[0.25em] uppercase font-semibold">Featured Product</p>
                <p className="text-2xl font-bold mt-2">Premium Collection</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border border-[var(--accent)]/20 rounded-full" />
            <div className="absolute -top-4 -left-4 w-16 h-16 border border-[var(--accent)]/10 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  )
}`,

  "src/components/ProductCard.jsx": `import { useContext } from 'react'
import { CartContext } from '../App'

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext)

  return (
    <div className="group product-hover bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border border-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
        </div>
        {product.badge && (
          <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded">
            {product.badge}
          </span>
        )}
        <button
          onClick={() => addToCart(product)}
          className="absolute bottom-3 left-3 right-3 accent-gradient text-black text-sm font-bold tracking-wider uppercase py-3 text-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
        >
          Add to Cart
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-400 tracking-wider uppercase mb-1">{product.category}</p>
        <h3 className="font-semibold text-base mb-2 group-hover:text-[var(--accent)] transition-colors">{product.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">\${product.price.toFixed(2)}</span>
          <button
            onClick={() => addToCart(product)}
            className="md:hidden text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}`,

  "src/pages/Home.jsx": `import { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'

const FEATURED_IDS = [1, 2, 3, 4]

export default function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.filter(p => FEATURED_IDS.includes(p.id))))
      .catch(() => {
        setProducts([
          { id: 1, name: "Obsidian Watch", price: 349.00, category: "Accessories", description: "Matte black titanium timepiece with sapphire crystal and Swiss movement.", badge: "New" },
          { id: 2, name: "Ivory Pendant Lamp", price: 189.00, category: "Lighting", description: "Hand-blown glass pendant with brushed brass hardware and warm LED.", badge: "Best Seller" },
          { id: 3, name: "Carbon Briefcase", price: 429.00, category: "Bags", description: "Full-grain leather briefcase with carbon fiber accents and brass clasps." },
          { id: 4, name: "Marble Desk Set", price: 159.00, category: "Office", description: "Carrara marble pen holder, card stand, and paperweight trio." },
        ])
      })
  }, [])

  return (
    <main>
      <Hero />

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-[var(--accent)] text-sm font-semibold tracking-[0.3em] uppercase mb-3">Curated Selection</p>
          <h2 className="text-4xl font-black tracking-tight">Featured Products</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">
          {[
            { title: "Free Shipping", desc: "On orders over $200", icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
            { title: "Premium Quality", desc: "Handcrafted materials", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" },
            { title: "Easy Returns", desc: "30-day return policy", icon: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full border border-[var(--accent)]/30 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}`,

  "src/pages/Products.jsx": `import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'

const CATEGORIES = ['All', 'Accessories', 'Lighting', 'Bags', 'Office', 'Home', 'Audio']

export default function Products() {
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState('default')

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
      .catch(() => {
        setProducts([
          { id: 1, name: "Obsidian Watch", price: 349.00, category: "Accessories", description: "Matte black titanium timepiece with sapphire crystal and Swiss movement.", badge: "New" },
          { id: 2, name: "Ivory Pendant Lamp", price: 189.00, category: "Lighting", description: "Hand-blown glass pendant with brushed brass hardware and warm LED.", badge: "Best Seller" },
          { id: 3, name: "Carbon Briefcase", price: 429.00, category: "Bags", description: "Full-grain leather briefcase with carbon fiber accents and brass clasps." },
          { id: 4, name: "Marble Desk Set", price: 159.00, category: "Office", description: "Carrara marble pen holder, card stand, and paperweight trio." },
          { id: 5, name: "Onyx Candle Trio", price: 89.00, category: "Home", description: "Three hand-poured soy candles in matte black ceramic vessels. Amber, cedar, and vanilla." },
          { id: 6, name: "Slate Speaker", price: 279.00, category: "Audio", description: "Wireless Bluetooth speaker in brushed aluminum with 360-degree sound. 12-hour battery." },
          { id: 7, name: "Noir Sunglasses", price: 225.00, category: "Accessories", description: "Titanium frame sunglasses with polarized lenses and matte black finish.", badge: "New" },
          { id: 8, name: "Architect Notebook", price: 45.00, category: "Office", description: "Italian leather journal with 200 pages of premium cream paper and gilt edges." },
        ])
      })
  }, [])

  const filtered = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory)

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-[var(--accent)] text-sm font-semibold tracking-[0.3em] uppercase mb-2">Collection</p>
        <h1 className="text-4xl font-black tracking-tight mb-6">All Products</h1>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={"px-4 py-2 text-sm font-medium tracking-wide uppercase transition-all rounded " +
                  (activeCategory === cat
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded text-sm text-gray-600 bg-white focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="default">Sort by</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name: A-Z</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {sorted.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No products found in this category.</p>
        </div>
      )}
    </main>
  )
}`,

  "src/pages/Cart.jsx": `import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { CartContext } from '../App'

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useContext(CartContext)

  if (cart.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gray-200 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added any items yet.</p>
        <Link to="/products" className="inline-flex accent-gradient text-black px-8 py-3 text-sm font-bold tracking-wider uppercase hover:opacity-90 transition-opacity">
          Continue Shopping
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black tracking-tight mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl group hover:border-gray-200 transition-colors">
              <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{item.name}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{item.category}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-200 rounded">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 text-gray-500 hover:text-black transition-colors">-</button>
                    <span className="px-3 py-1 text-sm font-semibold border-x border-gray-200">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-gray-500 hover:text-black transition-colors">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold">\${(item.price * item.quantity).toFixed(2)}</span>
                {item.quantity > 1 && (
                  <p className="text-xs text-gray-400 mt-0.5">\${item.price.toFixed(2)} each</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">\${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-[var(--accent)]">{cartTotal >= 200 ? 'Free' : '$15.00'}</span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">\${(cartTotal + (cartTotal >= 200 ? 0 : 15)).toFixed(2)}</span>
              </div>
            </div>
            <Link to="/checkout" className="block w-full accent-gradient text-black text-center py-4 text-sm font-bold tracking-wider uppercase hover:opacity-90 transition-opacity">
              Proceed to Checkout
            </Link>
            <Link to="/products" className="block w-full text-center mt-3 text-sm text-gray-500 hover:text-black transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}`,

  "src/pages/Checkout.jsx": `import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { CartContext } from '../App'

export default function Checkout() {
  const { cart, cartTotal } = useContext(CartContext)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', address: '', city: '', state: '', zip: '', cardNumber: '', expiry: '', cvv: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, customer: form, total: cartTotal })
      })
    } catch (err) {
      // Proceed anyway for demo
    }
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1500)
  }

  if (submitted) {
    return (
      <main className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-black flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-3xl font-black mb-2">Thank You!</h2>
        <p className="text-gray-500 mb-8">Your order has been placed successfully.</p>
        <Link to="/" className="inline-flex accent-gradient text-black px-8 py-3 text-sm font-bold tracking-wider uppercase hover:opacity-90 transition-opacity">
          Back to Home
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black tracking-tight mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-4">Shipping Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">First Name</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Last Name</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-500 mb-1">Address</label>
              <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">City</label>
                <input name="city" value={form.city} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">State</label>
                <input name="state" value={form.state} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">ZIP</label>
                <input name="zip" value={form.zip} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Payment</h3>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Card Number</label>
              <input name="cardNumber" value={form.cardNumber} onChange={handleChange} placeholder="1234 5678 9012 3456" required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Expiry</label>
                <input name="expiry" value={form.expiry} onChange={handleChange} placeholder="MM/YY" required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">CVV</label>
                <input name="cvv" value={form.cvv} onChange={handleChange} placeholder="123" required className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span className="font-medium">\${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>\${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-[var(--accent)]">{cartTotal >= 200 ? 'Free' : '$15.00'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>\${(cartTotal + (cartTotal >= 200 ? 0 : 15)).toFixed(2)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 accent-gradient text-black py-4 text-sm font-bold tracking-wider uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}`,
}

const BACKEND_FILES: Record<string, string> = {
  "package.json": `{
  "name": "ecommerce-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5"
  }
}`,

  "server.js": `import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ── In-memory Data ──────────────────────────────────────────

const products = [
  {
    id: 1,
    name: "Obsidian Watch",
    price: 349.00,
    category: "Accessories",
    description: "Matte black titanium timepiece with sapphire crystal and Swiss movement.",
    badge: "New",
    inStock: true,
  },
  {
    id: 2,
    name: "Ivory Pendant Lamp",
    price: 189.00,
    category: "Lighting",
    description: "Hand-blown glass pendant with brushed brass hardware and warm LED.",
    badge: "Best Seller",
    inStock: true,
  },
  {
    id: 3,
    name: "Carbon Briefcase",
    price: 429.00,
    category: "Bags",
    description: "Full-grain leather briefcase with carbon fiber accents and brass clasps.",
    badge: null,
    inStock: true,
  },
  {
    id: 4,
    name: "Marble Desk Set",
    price: 159.00,
    category: "Office",
    description: "Carrara marble pen holder, card stand, and paperweight trio.",
    badge: null,
    inStock: true,
  },
  {
    id: 5,
    name: "Onyx Candle Trio",
    price: 89.00,
    category: "Home",
    description: "Three hand-poured soy candles in matte black ceramic vessels. Amber, cedar, and vanilla.",
    badge: null,
    inStock: true,
  },
  {
    id: 6,
    name: "Slate Speaker",
    price: 279.00,
    category: "Audio",
    description: "Wireless Bluetooth speaker in brushed aluminum with 360-degree sound. 12-hour battery.",
    badge: null,
    inStock: true,
  },
  {
    id: 7,
    name: "Noir Sunglasses",
    price: 225.00,
    category: "Accessories",
    description: "Titanium frame sunglasses with polarized lenses and matte black finish.",
    badge: "New",
    inStock: true,
  },
  {
    id: 8,
    name: "Architect Notebook",
    price: 45.00,
    category: "Office",
    description: "Italian leather journal with 200 pages of premium cream paper and gilt edges.",
    badge: null,
    inStock: true,
  },
]

const carts = new Map()

function getCart(sessionId) {
  if (!carts.has(sessionId)) carts.set(sessionId, [])
  return carts.get(sessionId)
}

// ── Routes ──────────────────────────────────────────────────

app.get('/api/products', (req, res) => {
  const { category } = req.query
  if (category && category !== 'All') {
    return res.json(products.filter(p => p.category === category))
  }
  res.json(products)
})

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id))
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

app.post('/api/cart', (req, res) => {
  const { productId, quantity = 1, sessionId = 'default' } = req.body
  const product = products.find(p => p.id === productId)
  if (!product) return res.status(404).json({ error: 'Product not found' })

  const cart = getCart(sessionId)
  const existing = cart.find(item => item.productId === productId)

  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({ productId, quantity, product })
  }

  res.json({ cart, total: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) })
})

app.get('/api/cart', (req, res) => {
  const { sessionId = 'default' } = req.query
  const cart = getCart(sessionId)
  res.json({
    items: cart,
    total: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    count: cart.reduce((sum, item) => sum + item.quantity, 0),
  })
})

app.delete('/api/cart/:productId', (req, res) => {
  const { sessionId = 'default' } = req.query
  const cart = getCart(sessionId)
  const idx = cart.findIndex(item => item.productId === parseInt(req.params.productId))
  if (idx === -1) return res.status(404).json({ error: 'Item not in cart' })
  cart.splice(idx, 1)
  res.json({ cart, total: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) })
})

app.post('/api/checkout', (req, res) => {
  const { items, customer, total } = req.body
  if (!items || !customer) return res.status(400).json({ error: 'Missing required fields' })

  const orderId = 'ORD-' + Date.now().toString(36).toUpperCase()
  console.log('Order placed:', { orderId, items: items.length, total, customer: customer.email })

  res.json({
    success: true,
    orderId,
    message: 'Order placed successfully',
    estimatedDelivery: '3-5 business days',
  })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Start ───────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('E-Commerce API running on http://localhost:' + PORT)
})`,
}

// ════════════════════════════════════════════════════════════════
// MOCK DATA: Plan, Review, Test, Quality
// ════════════════════════════════════════════════════════════════

const PLAN_DATA = {
  intent: "build",
  projectMeta: {
    name: "E-Commerce Platform",
    description: "A modern e-commerce application with black and white design, gold accent color, and a hero section showcasing products. Features product browsing, cart management, and checkout.",
  },
  features: [
    "Hero section with product showcase and CTA buttons",
    "Product catalog with category filtering and sorting",
    "Product cards with hover-to-add-to-cart interaction",
    "Shopping cart with quantity management",
    "Checkout form with order confirmation",
    "Responsive black & white design with gold accent color",
    "RESTful API with product and cart endpoints",
  ],
  frontendTasks: [
    { task: "Set up React 18 + Vite + Tailwind CSS project", details: "Configure build tools with API proxy and custom theme colors" },
    { task: "Build Header component", details: "Sticky black header with navigation links, gold cart icon with badge, mobile hamburger menu" },
    { task: "Build Hero section", details: "Full-width black background hero with product showcase, gradient overlays, and dual CTA buttons" },
    { task: "Build ProductCard component", details: "Card with hover effects, image placeholder, category label, and accent Add to Cart button" },
    { task: "Build Home page", details: "Hero + featured products grid + value proposition section" },
    { task: "Build Products page", details: "Category filter pills, sort dropdown, responsive product grid" },
    { task: "Build Cart page", details: "Cart items with quantity controls, order summary sidebar, empty state" },
    { task: "Build Checkout page", details: "Shipping and payment forms, order summary, success confirmation screen" },
  ],
  backendTasks: [
    { task: "Set up Express.js server", details: "Configure CORS, JSON parsing, and route structure" },
    { task: "Implement product endpoints", details: "GET /api/products with category filtering, GET /api/products/:id" },
    { task: "Implement cart endpoints", details: "POST /api/cart, GET /api/cart, DELETE /api/cart/:id with session support" },
    { task: "Implement checkout endpoint", details: "POST /api/checkout with order ID generation and validation" },
  ],
  architecture: "Client-server architecture with React SPA communicating via REST API. Frontend uses React Router for navigation and Context API for cart state. Backend uses Express with in-memory data store.",
  techStack: {
    frontend: { framework: "React 18", styling: "Tailwind CSS", libraries: ["react-router-dom", "Vite"] },
    backend: { runtime: "Node.js", framework: "Express.js", database: "In-memory", libraries: ["cors"] },
  },
  notes: "The design follows a minimalist black and white aesthetic with a warm gold/amber (#C8A96E) as the single accent color throughout the UI. Product images use elegant geometric placeholders.",
}

const REVIEW_DATA = {
  completionStatus: {
    frontendComplete: true,
    backendComplete: true,
    missingItems: [],
  },
  setupGuide: {
    prerequisites: ["Node.js 18+", "npm or yarn"],
    steps: [
      "Install backend dependencies: cd backend && npm install",
      "Start backend server: npm run dev",
      "Install frontend dependencies: cd frontend && npm install",
      "Start frontend dev server: npm run dev",
      "Open http://localhost:5173 in your browser",
    ],
    envVariables: [],
    runCommands: {
      frontend: "npm run dev",
      backend: "npm run dev",
    },
  },
  codeReview: {
    issues: [],
    suggestions: [
      "Consider adding input validation on the checkout form (email format, card number pattern)",
    ],
  },
  summary: "Full-stack e-commerce application with clean separation between frontend and backend. All API endpoints match the frontend fetch calls. The black & white design with gold accents is consistently applied across all components.",
}

const TEST_DATA = {
  testSuite: {
    totalTests: 12,
    categories: {
      basic: [
        { name: "GET /api/products returns product list", description: "Verifies the products endpoint returns all 8 products with correct structure", priority: "critical" as const },
        { name: "GET /api/products/:id returns single product", description: "Fetches product by ID and validates all fields", priority: "high" as const },
        { name: "POST /api/cart adds item", description: "Adds a product to cart and verifies response includes updated cart", priority: "critical" as const },
        { name: "GET /api/cart returns cart contents", description: "Retrieves cart items with correct totals and count", priority: "high" as const },
        { name: "DELETE /api/cart/:id removes item", description: "Removes item from cart and verifies updated total", priority: "high" as const },
        { name: "POST /api/checkout processes order", description: "Submits order and receives order ID and confirmation", priority: "critical" as const },
      ],
      integration: [
        { name: "Cart quantity accumulation", description: "Adding same product multiple times increases quantity", priority: "high" as const },
        { name: "Cart total calculation", description: "Total correctly sums price * quantity for all items", priority: "high" as const },
        { name: "Frontend routes render correctly", description: "All pages (Home, Products, Cart, Checkout) mount without errors", priority: "critical" as const },
      ],
      edge: [
        { name: "GET /api/products/:id with invalid ID returns 404", description: "Non-existent product ID returns proper error response", priority: "medium" as const },
        { name: "POST /api/checkout with missing fields returns 400", description: "Incomplete checkout data is rejected with error", priority: "medium" as const },
      ],
      security: [
        { name: "API accepts only valid JSON", description: "Malformed request bodies are handled gracefully", priority: "low" as const },
      ],
    },
  },
  contractValidation: {
    endpointsCovered: [
      "GET /api/products",
      "GET /api/products/:id",
      "POST /api/cart",
      "GET /api/cart",
      "DELETE /api/cart/:productId",
      "POST /api/checkout",
    ],
    endpointsMissing: [],
    modelsCovered: ["Product", "CartItem", "Order"],
    fieldMismatches: [],
  },
  coverage: {
    endpointCoverage: 100,
    featureCoverage: 92,
    securityCoverage: 75,
  },
  summary: "All 12 tests passing. Full endpoint coverage with strong feature coverage. The checkout flow and cart management are thoroughly tested.",
}

const UNDERSTANDING_DATA = {
  summary: "I understand you want to build an e-commerce platform with a striking black and white design language, featuring a warm accent color (gold/amber) and a hero section that showcases your products prominently. The app will include product browsing, cart management, and a checkout flow.",
  projectName: "E-Commerce Platform",
  questions: [
    {
      id: "q1",
      question: "What type of products will the store sell?",
      options: [
        "Fashion & Apparel",
        "Home & Lifestyle goods",
        "Premium / Luxury items (mixed categories)",
        "Electronics & Gadgets",
      ],
    },
    {
      id: "q2",
      question: "Do you need user authentication (login/signup)?",
      options: [
        "No authentication needed, keep it simple",
        "Basic email/password login",
        "Full auth with Google/social login",
      ],
    },
    {
      id: "q3",
      question: "What accent color do you prefer?",
      options: [
        "Gold / Amber (#C8A96E)",
        "Warm Bronze (#CD7F32)",
        "Silver / Cool Gray (#A8A9AD)",
        "Deep Red (#8B0000)",
      ],
    },
  ],
}

const QA_ANSWERS = [
  "Premium / Luxury items (mixed categories)",
  "No authentication needed, keep it simple",
  "Gold / Amber (#C8A96E)",
]

// ════════════════════════════════════════════════════════════════
// PIPELINE STATUS BAR (replicated from App.tsx for self-containment)
// ════════════════════════════════════════════════════════════════

const AGENT_STATUS: Record<string, { color: string; label: string }> = {
  "Orchestrator Agent": { color: "var(--color-gold-500)", label: "Orchestrator" },
  "Frontend Agent":     { color: "#10b981", label: "Frontend" },
  "Backend Agent":      { color: "#3b82f6", label: "Backend" },
  "Review Agent":       { color: "#a855f7", label: "Review" },
  "Test Agent":         { color: "#f59e0b", label: "Test" },
}

const PIPELINE_ORDER = ["Orchestrator Agent", "Frontend Agent", "Backend Agent", "Review Agent", "Test Agent"]

function PipelineStatusBar({ currentAgent, completedAgents, currentStatus, tokenCount }: {
  currentAgent?: string
  completedAgents: string[]
  currentStatus: string
  tokenCount: number
}) {
  const barRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={barRef} className="flex items-center gap-2 w-full max-w-3xl px-1 animate-spring-in overflow-x-auto">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {PIPELINE_ORDER.map((agent, i) => {
          const cfg = AGENT_STATUS[agent]
          const isActive = currentAgent === agent
          const isCompleted = completedAgents.includes(agent)
          const isIdle = !isActive && !isCompleted

          return (
            <div key={agent} className="flex items-center">
              <div
                className={`pipe-badge flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap tracking-[-0.02em]
                  ${isActive
                    ? "bg-[#1A1A1A] border border-white/[0.12]"
                    : isCompleted
                      ? "bg-[var(--surface-base)] border border-white/[0.08]"
                      : "opacity-25"
                  }`}
                style={isActive ? { boxShadow: `0 0 12px ${cfg.color}15` } : undefined}
              >
                {isActive ? (
                  <div className="w-2 h-2 rounded-full flex-shrink-0 animate-agent-pulse" style={{ backgroundColor: cfg.color }} />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: cfg.color }} />
                ) : (
                  <Circle className="w-2 h-2 flex-shrink-0 text-white/15" />
                )}
                <span style={{ color: isIdle ? undefined : cfg.color }} className={`${isIdle ? "text-white/20" : ""} hidden sm:inline`}>
                  {cfg.label}
                </span>
              </div>
              {i < PIPELINE_ORDER.length - 1 && (
                <div
                  className={`pipe-line w-4 h-px mx-0.5 origin-left ${isCompleted ? "bg-white/10" : "bg-white/[0.04]"}`}
                  style={isCompleted ? { boxShadow: `0 0 4px ${cfg.color}20` } : undefined}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {currentStatus && (
          <span className="text-[10px] text-white/35 truncate max-w-[140px] font-medium">{currentStatus}</span>
        )}
        {tokenCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-white/30 font-mono">
            <Zap className="w-2.5 h-2.5 text-white/25" />
            ~{tokenCount.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// DEMO PLAYBACK HOOK
// ════════════════════════════════════════════════════════════════

type FlowStage = 'idle' | 'understanding' | 'waiting_understanding' | 'qa' | 'planning' | 'waiting_plan_review' | 'generating' | 'reviewing' | 'testing' | 'feedback' | 'completed'

interface DemoWsState {
  isConnected: boolean
  isGenerating: boolean
  currentStatus: string
  currentAgent?: string
  error: string | null
  streaming: {
    frontendStream: string
    backendStream: string
    reviewStream: string
    testStream: string
    activeAgent: string | null
  }
  tokenUsage: {
    frontend?: { promptTokens: number; completionTokens: number; totalTokens: number }
    backend?: { promptTokens: number; completionTokens: number; totalTokens: number }
    review?: { promptTokens: number; completionTokens: number; totalTokens: number }
    test?: { promptTokens: number; completionTokens: number; totalTokens: number }
    currentEstimate: number
  }
  flowStage: FlowStage
  completedAgents: string[]
  understandingData?: typeof UNDERSTANDING_DATA
  complexityScore?: number
  qualityScore?: { grade: string; metrics: Record<string, number>; overall: number; needsFeedback: boolean }
  feedbackIteration: number
  transportMode: 'websocket' | 'sse'
}

function makeMsg(
  overrides: Partial<Message> & { content: string; sender: Message['sender'] }
): Message {
  return {
    id: crypto.randomUUID(),
    username: overrides.sender === 'user' ? 'You' : 'System',
    timestamp: new Date(),
    ...overrides,
  }
}

function useDemoPlayback() {
  const [messages, setMessages] = useState<Message[]>([])
  const [wsState, setWsState] = useState<DemoWsState>({
    isConnected: true,
    isGenerating: false,
    currentStatus: '',
    error: null,
    streaming: { frontendStream: '', backendStream: '', reviewStream: '', testStream: '', activeAgent: null },
    tokenUsage: { currentEstimate: 0 },
    flowStage: 'idle',
    completedAgents: [],
    feedbackIteration: 0,
    transportMode: 'websocket',
  })
  const [phase, setPhase] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    intervalsRef.current.forEach(clearInterval)
    timersRef.current = []
    intervalsRef.current = []
  }, [])

  const delay = useCallback((ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms)
    timersRef.current.push(t)
    return t
  }, [])

  const streamText = useCallback((
    fullText: string,
    onChunk: (partial: string) => void,
    durationMs: number,
    onDone?: () => void,
  ) => {
    const chunkSize = Math.max(1, Math.ceil(fullText.length / (durationMs / 30)))
    let pos = 0
    const iv = setInterval(() => {
      pos = Math.min(pos + chunkSize, fullText.length)
      onChunk(fullText.slice(0, pos))
      if (pos >= fullText.length) {
        clearInterval(iv)
        onDone?.()
      }
    }, 30)
    intervalsRef.current.push(iv)
    return iv
  }, [])

  const startDemo = useCallback(() => {
    clearAllTimers()
    setMessages([])
    setPhase(0)
    setWsState({
      isConnected: true,
      isGenerating: false,
      currentStatus: '',
      error: null,
      streaming: { frontendStream: '', backendStream: '', reviewStream: '', testStream: '', activeAgent: null },
      tokenUsage: { currentEstimate: 0 },
      flowStage: 'idle',
      completedAgents: [],
      feedbackIteration: 0,
      transportMode: 'websocket',
    })

    const frontendStreamContent = JSON.stringify(FRONTEND_FILES, null, 2)
    const backendStreamContent = JSON.stringify(BACKEND_FILES, null, 2)

    // ── t=0s: User message ──────────────────────────────
    delay(500, () => {
      setMessages([makeMsg({
        sender: 'user',
        content: 'Build an E-commerce Platform with black and white design, accent color and hero section showcasing products',
        type: 'text',
        intent: 'build',
      })])
      setWsState(s => ({ ...s, isGenerating: true }))
      setPhase(1)
    })

    // ── t=2s: Understanding status ──────────────────────
    delay(2000, () => {
      setWsState(s => ({
        ...s,
        currentStatus: 'Understanding your project...',
        flowStage: 'understanding',
        currentAgent: 'Orchestrator Agent',
      }))
      setPhase(2)
    })

    // ── t=4s: Understanding complete ────────────────────
    delay(4000, () => {
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: UNDERSTANDING_DATA.summary,
        type: 'understanding',
        data: UNDERSTANDING_DATA,
      })])
      setWsState(s => ({
        ...s,
        flowStage: 'waiting_understanding',
        currentStatus: 'Waiting for your confirmation...',
        understandingData: UNDERSTANDING_DATA,
        currentAgent: undefined,
      }))
      setPhase(3)
    })

    // ── t=7s: Auto-confirm understanding ────────────────
    delay(7000, () => {
      setWsState(s => ({
        ...s,
        flowStage: 'qa',
        currentStatus: 'Asking clarifying questions...',
      }))
      // Add first question
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: UNDERSTANDING_DATA.questions[0].question,
        type: 'qa_question',
        data: UNDERSTANDING_DATA.questions[0],
      })])
      setPhase(4)
    })

    // ── t=9s: Answer Q1 ─────────────────────────────────
    delay(9000, () => {
      setMessages(prev => [
        ...prev,
        makeMsg({ sender: 'user', content: QA_ANSWERS[0], type: 'qa_answer' }),
      ])
    })

    // ── t=10.5s: Q2 ─────────────────────────────────────
    delay(10500, () => {
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: UNDERSTANDING_DATA.questions[1].question,
        type: 'qa_question',
        data: UNDERSTANDING_DATA.questions[1],
      })])
    })

    // ── t=12.5s: Answer Q2 ──────────────────────────────
    delay(12500, () => {
      setMessages(prev => [
        ...prev,
        makeMsg({ sender: 'user', content: QA_ANSWERS[1], type: 'qa_answer' }),
      ])
    })

    // ── t=14s: Q3 ───────────────────────────────────────
    delay(14000, () => {
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: UNDERSTANDING_DATA.questions[2].question,
        type: 'qa_question',
        data: UNDERSTANDING_DATA.questions[2],
      })])
    })

    // ── t=16s: Answer Q3 ────────────────────────────────
    delay(16000, () => {
      setMessages(prev => [
        ...prev,
        makeMsg({ sender: 'user', content: QA_ANSWERS[2], type: 'qa_answer' }),
      ])
      setWsState(s => ({
        ...s,
        flowStage: 'planning',
        currentStatus: 'Architecting your project...',
        currentAgent: 'Orchestrator Agent',
      }))
      setPhase(5)
    })

    // ── t=20s: Plan complete ────────────────────────────
    delay(20000, () => {
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: '',
        type: 'final_plan',
        data: PLAN_DATA,
      })])
      setWsState(s => ({
        ...s,
        flowStage: 'waiting_plan_review',
        currentStatus: 'Review the plan',
        currentAgent: undefined,
      }))
      setPhase(6)
    })

    // ── t=24s: Auto-approve plan ────────────────────────
    delay(24000, () => {
      setWsState(s => ({
        ...s,
        flowStage: 'generating',
        currentStatus: 'Building your project...',
        currentAgent: 'Orchestrator Agent',
        complexityScore: 3,
      }))
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: 'Starting code generation...',
        type: 'text',
      })])
      setPhase(7)
    })

    // ── t=25s: Complexity score ──────────────────────────
    delay(25000, () => {
      setWsState(s => ({
        ...s,
        complexityScore: 3,
        tokenUsage: { ...s.tokenUsage, currentEstimate: 1200 },
      }))
    })

    // ── t=26s: Start frontend + backend streams ────────
    delay(26000, () => {
      setWsState(s => ({
        ...s,
        currentAgent: 'Frontend Agent',
        completedAgents: ['Orchestrator Agent'],
        currentStatus: 'Generating frontend code...',
        streaming: { ...s.streaming, activeAgent: 'Frontend Agent', frontendStream: ' ' },
      }))

      // Stream frontend over 12s
      streamText(
        frontendStreamContent,
        (partial) => {
          setWsState(s => ({
            ...s,
            streaming: { ...s.streaming, frontendStream: partial },
            tokenUsage: { ...s.tokenUsage, currentEstimate: Math.ceil(partial.length / 4) },
          }))
        },
        12000,
      )

      // Start backend streaming 2s later
      delay(2000, () => {
        setWsState(s => ({
          ...s,
          streaming: {
            ...s.streaming,
            activeAgent: 'Frontend Agent',
            backendStream: ' ',
          },
        }))

        streamText(
          backendStreamContent,
          (partial) => {
            setWsState(s => ({
              ...s,
              streaming: { ...s.streaming, backendStream: partial },
            }))
          },
          10000,
        )
      })
    })

    // ── t=38s: Backend complete (pause after stream ends) ─
    delay(38000, () => {
      setWsState(s => ({
        ...s,
        completedAgents: [...s.completedAgents.filter(a => a !== 'Backend Agent'), 'Backend Agent'],
        streaming: { ...s.streaming, backendStream: backendStreamContent },
        tokenUsage: {
          ...s.tokenUsage,
          backend: { promptTokens: 1800, completionTokens: 3200, totalTokens: 5000 },
        },
      }))
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: 'Backend code generated — Express.js API with product catalog, cart management, and checkout endpoints.',
        type: 'backend',
        data: BACKEND_FILES,
        intent: 'build',
      })])
    })

    // ── t=42s: Frontend complete (pause after stream ends) ─
    delay(42000, () => {
      setWsState(s => ({
        ...s,
        completedAgents: [...s.completedAgents.filter(a => a !== 'Frontend Agent'), 'Frontend Agent'],
        streaming: { ...s.streaming, frontendStream: frontendStreamContent, activeAgent: null },
        tokenUsage: {
          ...s.tokenUsage,
          frontend: { promptTokens: 3500, completionTokens: 8500, totalTokens: 12000 },
          currentEstimate: 0,
        },
      }))
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: 'Frontend code generated — React 18 + Tailwind CSS with black & white design, gold accent, hero section, product grid, cart, and checkout.',
        type: 'frontend',
        data: FRONTEND_FILES,
        intent: 'build',
      })])
    })

    // ── t=45s: Start review ─────────────────────────────
    delay(45000, () => {
      setWsState(s => ({
        ...s,
        currentAgent: 'Review Agent',
        currentStatus: 'Reviewing code quality...',
        flowStage: 'reviewing',
        streaming: { ...s.streaming, reviewStream: ' ', activeAgent: 'Review Agent' },
        tokenUsage: { ...s.tokenUsage, currentEstimate: 800 },
      }))

      const reviewStreamContent = JSON.stringify(REVIEW_DATA, null, 2)
      streamText(
        reviewStreamContent,
        (partial) => {
          setWsState(s => ({
            ...s,
            streaming: { ...s.streaming, reviewStream: partial },
            tokenUsage: { ...s.tokenUsage, currentEstimate: Math.ceil(partial.length / 4) },
          }))
        },
        6000,
      )
    })

    // ── t=52s: Review complete ──────────────────────────
    delay(52000, () => {
      setWsState(s => ({
        ...s,
        completedAgents: [...s.completedAgents.filter(a => a !== 'Review Agent'), 'Review Agent'],
        streaming: { ...s.streaming, reviewStream: '', activeAgent: null },
        tokenUsage: {
          ...s.tokenUsage,
          review: { promptTokens: 2200, completionTokens: 1800, totalTokens: 4000 },
          currentEstimate: 0,
        },
      }))
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: REVIEW_DATA.summary,
        type: 'review',
        data: REVIEW_DATA,
        intent: 'build',
      })])
    })

    // ── t=54s: Start testing ────────────────────────────
    delay(54000, () => {
      setWsState(s => ({
        ...s,
        currentAgent: 'Test Agent',
        currentStatus: 'Running test suite...',
        flowStage: 'testing',
        streaming: { ...s.streaming, testStream: ' ', activeAgent: 'Test Agent' },
        tokenUsage: { ...s.tokenUsage, currentEstimate: 600 },
      }))

      const testStreamContent = JSON.stringify(TEST_DATA, null, 2)
      streamText(
        testStreamContent,
        (partial) => {
          setWsState(s => ({
            ...s,
            streaming: { ...s.streaming, testStream: partial },
            tokenUsage: { ...s.tokenUsage, currentEstimate: Math.ceil(partial.length / 4) },
          }))
        },
        5000,
      )
    })

    // ── t=60s: Test complete ────────────────────────────
    delay(60000, () => {
      setWsState(s => ({
        ...s,
        completedAgents: [...s.completedAgents.filter(a => a !== 'Test Agent'), 'Test Agent'],
        streaming: { ...s.streaming, testStream: '', activeAgent: null },
        tokenUsage: {
          ...s.tokenUsage,
          test: { promptTokens: 1500, completionTokens: 1500, totalTokens: 3000 },
          currentEstimate: 0,
        },
      }))
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: '',
        type: 'test',
        data: TEST_DATA,
        intent: 'build',
      })])
    })

    // ── t=63s: Quality score ────────────────────────────
    delay(63000, () => {
      const qualityData = {
        grade: 'A',
        metrics: { completeness: 95, security: 82, compatibility: 98, codeQuality: 90, testCoverage: 88 },
        overall: 91,
        needsFeedback: false,
      }
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: '',
        type: 'quality_score',
        data: qualityData,
      })])
      setWsState(s => ({
        ...s,
        qualityScore: qualityData,
      }))
    })

    // ── t=66s: Complete ─────────────────────────────────
    delay(66000, () => {
      setMessages(prev => [...prev, makeMsg({
        sender: 'agent',
        content: 'Your e-commerce platform is ready! Open the IDE to explore the full codebase, preview the app, or download the project files.',
        type: 'text',
      })])
      setWsState(s => ({
        ...s,
        isGenerating: false,
        flowStage: 'completed',
        currentStatus: '',
        currentAgent: undefined,
        completedAgents: ['Orchestrator Agent', 'Frontend Agent', 'Backend Agent', 'Review Agent', 'Test Agent'],
        streaming: { frontendStream: '', backendStream: '', reviewStream: '', testStream: '', activeAgent: null },
      }))
      setPhase(99)
    })
  }, [clearAllTimers, delay, streamText])

  // Auto-start on mount
  useEffect(() => {
    startDemo()
    return clearAllTimers
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { messages, wsState, startDemo, phase }
}

// ════════════════════════════════════════════════════════════════
// DEMO PAGE COMPONENT
// ════════════════════════════════════════════════════════════════

export default function DemoPage() {
  const { messages, wsState, startDemo } = useDemoPlayback()

  const [previewOpen, setPreviewOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [qaCollapsed, setQaCollapsed] = useState(false)
  const [understandingExpanded, setUnderstandingExpanded] = useState(false)
  const [planExpanded, setPlanExpanded] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, wsState.streaming.frontendStream, wsState.streaming.backendStream, wsState.streaming.reviewStream, wsState.streaming.testStream, wsState.currentStatus])

  // Latest files for IDE
  const latestFrontendFiles = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.type === "frontend" && m.data && typeof m.data === "object") {
        const files = Object.entries(m.data).filter(([, v]) => typeof v === "string") as [string, string][]
        if (files.length > 0) return files
      }
    }
    return null
  }, [messages])

  const latestBackendFiles = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.type === "backend" && m.data && typeof m.data === "object") {
        const files = Object.entries(m.data).filter(([, v]) => typeof v === "string") as [string, string][]
        if (files.length > 0) return files
      }
    }
    return null
  }, [messages])

  const completedTokens =
    (wsState.tokenUsage.frontend?.totalTokens ?? 0) +
    (wsState.tokenUsage.backend?.totalTokens ?? 0) +
    (wsState.tokenUsage.review?.totalTokens ?? 0) +
    (wsState.tokenUsage.test?.totalTokens ?? 0)
  const totalTokensDisplay = completedTokens + (wsState.tokenUsage.currentEstimate ?? 0)

  const showPipeline = wsState.isGenerating && (wsState.currentAgent || wsState.completedAgents.length > 0)
    && wsState.flowStage !== 'understanding' && wsState.flowStage !== 'waiting_understanding' && wsState.flowStage !== 'qa'

  // Q&A tracking
  const questions = wsState.understandingData?.questions || []
  const qaQuestionCount = messages.filter(m => m.type === 'qa_question').length
  const understandingCompleted = messages.some(m =>
    m.type === 'final_plan' || m.type === 'qa_summary' || m.type === 'qa_question'
  )

  // Count answered questions based on qa_answer messages
  const qaAnswerMessages = messages.filter(m => m.type === 'qa_answer')

  return (
    <>
      {previewOpen && latestFrontendFiles && (
        <IDEModal
          files={latestFrontendFiles}
          backendFiles={latestBackendFiles || undefined}
          title={latestBackendFiles ? "Full-Stack IDE" : "Frontend IDE"}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      <div className="flex h-screen w-screen bg-background overflow-hidden">
        {/* ── Sidebar ──────────────────────────────────────── */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* ── Main content column ──────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* ── Top bar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-white/[0.05] flex-shrink-0 bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-500/50" />
              <span className="text-[13px] font-semibold text-white/60 tracking-[-0.02em]">Demo Mode</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gold-500/[0.08] border border-gold-500/15 text-gold-500/60">
                REPLAY
              </span>
            </div>
            {wsState.complexityScore !== undefined && wsState.isGenerating && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-gold-500/[0.06] border-gold-500/15 text-gold-500/60 text-[10px] font-mono font-semibold tracking-wide uppercase">
                <Shield className="w-3 h-3" />
                <span>Complexity {wsState.complexityScore}/5</span>
              </div>
            )}
            {wsState.isGenerating && totalTokensDisplay > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/35 text-[10px] font-mono">
                <Zap className="w-3 h-3 text-gold-500/30" />
                <span>~{totalTokensDisplay.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { startDemo() }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-white/[0.10] text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
            <button
              onClick={() => latestFrontendFiles && setPreviewOpen(true)}
              disabled={mounted ? !latestFrontendFiles : true}
              title={mounted && latestFrontendFiles ? "Open IDE" : "Generate a project first"}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[13px] font-semibold border transition-all tracking-[-0.02em] ${
                latestFrontendFiles
                  ? "text-white/90 bg-gold-500/[0.08] hover:bg-gold-500/[0.12] border-gold-500/20 hover:border-gold-500/35 shadow-[0_0_12px_rgba(230,179,62,0.06)]"
                  : "text-white/10 bg-transparent border-white/[0.06] cursor-not-allowed"
              }`}
            >
              <Code2 className={`w-4 h-4 ${latestFrontendFiles ? "text-gold-500/70" : ""}`} />
              <span className="hidden sm:inline">IDE</span>
            </button>
          </div>
        </div>

        {/* ── Chat Column ─────────────────────────────────── */}
        <div className="relative flex flex-col flex-1 overflow-hidden min-w-0">
          <BGPattern mask="fade-edges" size={28} fill="#1a1a1a" />

          {/* Messages */}
          <div
            ref={scrollRef}
            className="relative z-[1] flex flex-col overflow-y-auto overflow-x-hidden gap-4 md:gap-5 flex-1 px-3 md:px-8 py-4 md:py-6 pb-8 md:pb-10 chat-scroll"
          >
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center text-center max-w-lg px-6 md:p-10 animate-spring-in">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gold-500/[0.04] border border-gold-500/10 flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-gold-500/40" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-gold-500/35 mb-3">
                    Demo mode
                  </span>
                  <h3 className="text-xl md:text-2xl font-display italic text-white/85 mb-3 tracking-[-0.03em]">
                    Starting demo playback...
                  </h3>
                  <div className="flex gap-1 mt-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-500/40 typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-500/40 typing-dot" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-500/40 typing-dot" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {(() => {
                  let qaBlockRendered = false

                  return messages.map((message) => {
                    // ── Understanding card ──────────────
                    if (message.type === 'understanding' && message.data) {
                      if (understandingCompleted) {
                        return (
                          <div key={message.id} className="animate-spring-in flex gap-3">
                            <div className="flex flex-col items-center flex-shrink-0">
                              <Check className="w-4 h-4 text-gold-500/50" />
                              <div className="w-px flex-1 bg-white/[0.06]" />
                            </div>
                            <div className="flex-1 min-w-0 -mt-0.5">
                              <button
                                onClick={() => setUnderstandingExpanded(e => !e)}
                                className="flex items-center gap-1 hover:opacity-80 transition-opacity text-sm text-white/45"
                              >
                                Project understood
                                <ChevronRight className={`w-3 h-3 chevron-rotate ${understandingExpanded ? "open" : ""}`} />
                              </button>
                              <Collapse open={understandingExpanded}>
                                <div className="mt-2 mb-2">
                                  <p className="text-sm text-white/50 leading-relaxed">{message.data.summary}</p>
                                </div>
                              </Collapse>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <UnderstandingCard
                          key={message.id}
                          summary={message.data.summary}
                          projectName={message.data.projectName}
                          hasQuestions={(message.data.questions?.length ?? 0) > 0}
                          onConfirm={() => {}}
                          onReject={() => {}}
                        />
                      )
                    }

                    // ── Q&A messages ──────────────────
                    if (message.type === 'qa_question' || message.type === 'qa_answer') {
                      if (qaCollapsed) {
                        if (!qaBlockRendered) {
                          qaBlockRendered = true
                          return (
                            <button
                              key="qa-collapsed"
                              onClick={() => setQaCollapsed(false)}
                              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                              <Check className="w-4 h-4 text-gold-500/50 flex-shrink-0" />
                              <span className="text-sm text-white/45 flex items-center gap-1">
                                {qaQuestionCount} {qaQuestionCount === 1 ? 'question' : 'questions'} answered
                                <ChevronRight className="w-3 h-3 chevron-rotate" />
                              </span>
                            </button>
                          )
                        }
                        return null
                      }

                      if (message.type === 'qa_question' && message.data) {
                        const qIdx = questions.findIndex(q => q.id === message.data.id)
                        // Check if this question was answered (is there a qa_answer after it for this question index?)
                        const answeredValue = QA_ANSWERS[qIdx] !== undefined && qaAnswerMessages.length > qIdx ? QA_ANSWERS[qIdx] : undefined

                        return (
                          <ClarifyingQuestion
                            key={message.id}
                            question={message.data.question}
                            options={message.data.options}
                            questionNumber={qIdx + 1}
                            totalQuestions={questions.length}
                            onAnswer={() => {}}
                            answered={answeredValue}
                          />
                        )
                      }

                      if (message.type === 'qa_answer') {
                        return null
                      }
                    }

                    // ── Final plan card ──────────────────
                    if (message.type === 'final_plan' && message.data) {
                      const planIdx = messages.indexOf(message)
                      const hasSubsequent = messages.slice(planIdx + 1).some(m =>
                        m.type === 'frontend' || m.type === 'backend' || m.type === 'review' || m.type === 'text'
                      )
                      if (hasSubsequent) {
                        return (
                          <div key={message.id} className="animate-spring-in flex gap-3">
                            <div className="flex flex-col items-center flex-shrink-0">
                              <Check className="w-4 h-4 text-gold-500/50" />
                              <div className="w-px flex-1 bg-white/[0.06]" />
                            </div>
                            <div className="flex-1 min-w-0 -mt-0.5">
                              <button
                                onClick={() => setPlanExpanded(e => !e)}
                                className="flex items-center gap-1 hover:opacity-80 transition-opacity text-sm text-white/45"
                              >
                                Plan reviewed
                                <ChevronRight className={`w-3 h-3 chevron-rotate ${planExpanded ? "open" : ""}`} />
                              </button>
                              <Collapse open={planExpanded}>
                                <div className="mt-2 mb-1">
                                  <FeatureReviewCard
                                    data={message.data}
                                    onProceed={() => {}}
                                    onStop={() => {}}
                                    onClarify={() => {}}
                                    readOnly
                                  />
                                </div>
                              </Collapse>
                            </div>
                          </div>
                        )
                      }
                      return (
                        <FeatureReviewCard
                          key={message.id}
                          data={message.data}
                          onProceed={() => {}}
                          onStop={() => {}}
                          onClarify={() => {}}
                        />
                      )
                    }

                    // ── Review card ────────────────────
                    if (message.type === 'review') {
                      return (
                        <MessageCard key={message.id} message={{
                          ...message,
                          data: { summary: message.data?.summary || message.content },
                        }} allMessages={messages} groupPos="solo" />
                      )
                    }

                    // ── Test results card ────────────────
                    if (message.type === 'test' && message.data) {
                      return <TestResultsCard key={message.id} data={message.data} />
                    }

                    // ── Quality score card ───────────────
                    if (message.type === 'quality_score' && message.data) {
                      return (
                        <QualityScoreCard
                          key={message.id}
                          grade={message.data.grade}
                          metrics={message.data.metrics}
                          overall={message.data.overall}
                          needsFeedback={message.data.needsFeedback}
                        />
                      )
                    }

                    // ── Skip orchestrator ────────────────
                    if (message.type === 'orchestrator') return null

                    // ── Regular messages ─────────────────
                    return <MessageCard key={message.id} message={message} allMessages={messages} groupPos="solo" />
                  })
                })()}

                {/* Streaming dropdowns */}
                {wsState.streaming.frontendStream && (
                  <StreamingDropdown
                    content={wsState.streaming.frontendStream}
                    agent="Frontend Agent"
                    isActive={!!wsState.streaming.frontendStream && !wsState.completedAgents.includes('Frontend Agent')}
                    tokenUsage={wsState.tokenUsage.frontend}
                    liveEstimate={wsState.tokenUsage.currentEstimate}
                  />
                )}

                {wsState.streaming.backendStream && (
                  <StreamingDropdown
                    content={wsState.streaming.backendStream}
                    agent="Backend Agent"
                    isActive={!!wsState.streaming.backendStream && !wsState.completedAgents.includes('Backend Agent')}
                    tokenUsage={wsState.tokenUsage.backend}
                    liveEstimate={wsState.tokenUsage.currentEstimate}
                  />
                )}

                {wsState.streaming.reviewStream && (
                  <StreamingDropdown
                    content={wsState.streaming.reviewStream}
                    agent="Review Agent"
                    isActive={wsState.streaming.activeAgent === "Review Agent"}
                    tokenUsage={wsState.tokenUsage.review}
                    liveEstimate={
                      wsState.streaming.activeAgent === "Review Agent"
                        ? wsState.tokenUsage.currentEstimate : undefined
                    }
                  />
                )}

                {wsState.streaming.testStream && (
                  <StreamingDropdown
                    content={wsState.streaming.testStream}
                    agent="Test Agent"
                    isActive={wsState.streaming.activeAgent === "Test Agent"}
                    tokenUsage={wsState.tokenUsage.test}
                    liveEstimate={
                      wsState.streaming.activeAgent === "Test Agent"
                        ? wsState.tokenUsage.currentEstimate : undefined
                    }
                  />
                )}

                {/* Status indicator */}
                {wsState.isGenerating && wsState.currentStatus && !wsState.currentAgent
                  && wsState.flowStage !== 'waiting_understanding' && wsState.flowStage !== 'qa'
                  && wsState.flowStage !== 'waiting_plan_review' && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1A1A1A] border border-white/[0.08] max-w-md animate-bubble-in">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/25 typing-dot" />
                    </div>
                    <span className="text-[13px] text-white/35 font-medium">{wsState.currentStatus}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Pipeline status bar + footer ────────────── */}
          <div className="flex flex-col items-center gap-2.5 px-3 md:px-8 py-3 md:py-4 flex-shrink-0 border-t border-white/[0.05] bg-[#050505]">
            {showPipeline && (
              <PipelineStatusBar
                currentAgent={wsState.currentAgent}
                completedAgents={wsState.completedAgents}
                currentStatus={wsState.currentStatus}
                tokenCount={totalTokensDisplay}
              />
            )}

            <div className="flex items-center gap-3 w-full max-w-3xl">
              <div className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white/20 text-sm">
                <Sparkles className="w-4 h-4 text-white/15" />
                <span>Demo mode — watching pipeline replay</span>
              </div>
              <button
                onClick={startDemo}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gold-500/[0.06] hover:bg-gold-500/[0.10] border border-gold-500/20 hover:border-gold-500/35 text-gold-500/70 hover:text-gold-500 text-[13px] font-semibold tracking-[-0.02em] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restart
              </button>
            </div>
          </div>
        </div>
        </div>{/* close main content column */}
      </div>
    </>
  )
}
