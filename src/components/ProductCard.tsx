import React from 'react';
import { Product } from '../types';
import { Shield, Sparkles, Truck, RefreshCw, Star, Info } from 'lucide-react';

const shoeImg = "/src/assets/images/velocity_pro_sneaker_1784039390019.jpg";

interface ProductCardProps {
  product: Product;
  selectedSize: number;
  setSelectedSize: (size: number) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  quantity: number;
  setQuantity: (qty: number) => void;
  currency: 'SLE' | 'USD';
  setCurrency: (currency: 'SLE' | 'USD') => void;
}

export default function ProductCard({
  product,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  quantity,
  setQuantity,
  currency,
  setCurrency,
}: ProductCardProps) {
  const currentPrice = currency === 'SLE' ? product.price : product.priceUSD;
  const baseSubtotal = currentPrice * quantity;
  const shipping = currency === 'SLE' ? 110 : 5; // SLE vs USD
  const tax = Math.round(baseSubtotal * 0.15); // 15% GST
  const total = baseSubtotal + shipping + tax;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-fade-in" id="product-display-card">
      {/* Product Image Section */}
      <div className="relative bg-slate-50 p-6 flex items-center justify-center min-h-[320px] md:min-h-[400px]">
        {/* Floating badge */}
        <div className="absolute top-4 left-4 z-10 bg-black text-white text-[10px] font-mono tracking-widest px-3 py-1.5 uppercase rounded-full flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-white rotate-45"></div>
          <span>COLLECTION 2026</span>
        </div>

        {/* Currency Switcher */}
        <div className="absolute top-4 right-4 z-10 bg-white border border-slate-150 p-1 rounded-full flex gap-1 shadow-sm">
          <button
            onClick={() => setCurrency('SLE')}
            className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-all duration-300 ${
              currency === 'SLE'
                ? 'bg-black text-white'
                : 'text-slate-400 hover:text-black'
            }`}
            id="currency-toggle-sle"
          >
            SLE
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full transition-all duration-300 ${
              currency === 'USD'
                ? 'bg-black text-white'
                : 'text-slate-400 hover:text-black'
            }`}
            id="currency-toggle-usd"
          >
            USD
          </button>
        </div>

        {/* Image wrapper */}
        <div className="w-full max-w-[340px] transform hover:scale-105 transition-transform duration-500 ease-out">
          <img
            src={shoeImg}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain select-none"
            id="shoe-product-image"
          />
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-8 flex flex-col flex-grow">
        {/* Title, rating and price */}
        <div className="mb-6">
          <div className="flex items-center gap-1 text-black mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-black stroke-black" />
            ))}
            <span className="text-xs text-slate-400 ml-2 font-mono tracking-wide">(4.9/5 • 124 reviews)</span>
          </div>
          <h1 className="text-3xl font-extrabold font-sans text-slate-900 tracking-tight leading-none mb-3">
            {product.name}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-4">
            {product.description}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-sans text-black underline underline-offset-8">
              {currency === 'SLE' ? 'Le ' : '$'}
              {currentPrice.toLocaleString()}
            </span>
            <span className="text-slate-400 text-xs font-mono tracking-wider uppercase">
              {currency === 'SLE' ? 'SLE' : 'USD'}
            </span>
          </div>
        </div>

        {/* Color selection */}
        <div className="mb-6">
          <span className="block text-xs font-bold text-slate-500 font-mono tracking-widest uppercase mb-3">
            COLORWAY : <span className="text-slate-900 font-sans font-medium">{selectedColor}</span>
          </span>
          <div className="flex gap-3">
            {product.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c.name)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  selectedColor === c.name
                    ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                    : 'hover:scale-105 opacity-80'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
                id={`color-select-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {selectedColor === c.name && (
                  <span className={`w-2.5 h-2.5 rounded-full ${c.name === 'Midnight Matte' ? 'bg-white' : 'bg-slate-950'}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Size selection */}
        <div className="mb-6">
          <span className="block text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase mb-3">
            SELECT SIZE (US)
          </span>
          <div className="grid grid-cols-6 gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
                  selectedSize === size
                    ? 'bg-black border-black text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-black'
                }`}
                id={`size-select-${size}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity selector */}
        <div className="mb-8 flex items-center justify-between border-t border-b border-slate-100 py-4">
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">
            QUANTITY
          </span>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-150">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 transition-colors"
              id="quantity-decrease"
            >
              -
            </button>
            <span className="w-10 text-center font-bold text-slate-800 font-mono text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 transition-colors"
              id="quantity-increase"
            >
              +
            </button>
          </div>
        </div>

        {/* Price Breakdowns */}
        <div className="bg-slate-50 rounded-3xl p-6 mb-6 space-y-3 border border-slate-100 font-sans">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'})</span>
            <span className="font-mono text-slate-800">
              {currency === 'SLE' ? 'Le ' : '$'}
              {baseSubtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span>Delivery Shipping</span>
            <span className="font-mono text-slate-800">
              {currency === 'SLE' ? 'Le ' : '$'}
              {shipping.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm text-slate-500">
            <span className="flex items-center gap-1">
              Estimated Tax (15% GST)
              <Info className="w-3.5 h-3.5 text-slate-400" title="15% Goods and Services Tax" />
            </span>
            <span className="font-mono text-slate-800">
              {currency === 'SLE' ? 'Le ' : '$'}
              {tax.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-slate-200/60 pt-3 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-950">Total order amount</span>
            <span className="text-2xl font-extrabold font-sans text-black">
              {currency === 'SLE' ? 'Le ' : '$'}
              {total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Benefits Badges */}
        <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-slate-150">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <span>FAST DELIVERY</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <span>SECURE CHECKOUT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
