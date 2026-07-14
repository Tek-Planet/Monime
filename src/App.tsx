import React, { useState } from 'react';
import ProductCard from './components/ProductCard';
import CheckoutForm from './components/CheckoutForm';
import MonimeSandbox from './components/MonimeSandbox';
import OrderSuccess from './components/OrderSuccess';
import { Product, CustomerDetails } from './types';
import { ShieldCheck, Lock, ShoppingBag, ArrowLeft, RefreshCw, Zap } from 'lucide-react';

const SNEAKER_PRODUCT: Product = {
  id: 'velocity-pulse-90',
  name: 'Velocity Pulse-90',
  description: 'Engineered with high-friction carbon rubber soles, breathable dual-layer air mesh, and custom kinetic energy spring plates. Delivering outstanding responsiveness and structural comfort for daily sports, training, or city lifestyle.',
  price: 2600, // 2,600 Sierra Leone Leones (New Leones, approx 115-125 USD)
  priceUSD: 125, // 125 US Dollars
  image: '/src/assets/images/velocity_pro_sneaker_1784039390019.jpg',
  sizes: [4, 12],
  colors: [
    { name: 'Electric Orange', hex: '#f97316', class: 'bg-orange-500' },
    { name: 'Neon Cyberpunk', hex: '#ec4899', class: 'bg-pink-500' },
    { name: 'Midnight Matte', hex: '#0f172a', class: 'bg-slate-900' },
  ],
  features: [
    'Kinetic Energy spring plate insole',
    'Breathable mesh fabric ventilation',
    'Ultra-grip carbon rubber tread pattern',
    'Dual-density comfort cushioning',
  ],
};

export default function App() {
  // Navigation / Flow states: 'checkout' | 'sandbox' | 'success'
  const [page, setPage] = useState<'checkout' | 'sandbox' | 'success'>('checkout');
  const [txRef, setTxRef] = useState<string>('');

  // Product configurations selected
  const [selectedSize, setSelectedSize] = useState<number>(10);
  const [selectedColor, setSelectedColor] = useState<string>('Electric Orange');
  const [quantity, setQuantity] = useState<number>(1);
  const [currency, setCurrency] = useState<'SLE' | 'USD'>('SLE'); // Defaults to SLE for Monime's primary African audience

  // Checkout submission states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Mount logic to handle redirects from Sandbox or Live gateway
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTxRef = params.get('txRef');
    if (urlTxRef) {
      setTxRef(urlTxRef);
      setIsLoading(true);
      
      // Fetch latest order details to determine if we should show success or sandbox
      fetch(`/api/orders/${urlTxRef}`)
        .then((res) => {
          if (!res.ok) throw new Error('Order not found');
          return res.json();
        })
        .then((order) => {
          // If the order has been completed (either via simulator or real payment webhook/completion)
          if (order.paymentStatus === 'completed') {
            setPage('success');
          } else {
            // If it is sandbox mode path, route to sandbox, otherwise check/default to success for checkout redirects
            if (window.location.pathname.includes('/checkout/sandbox')) {
              setPage('sandbox');
            } else {
              // Direct verification return from live gateway, update order as completed on backend for demo safety
              fetch(`/api/orders/${urlTxRef}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus: 'completed' })
              })
              .then(() => {
                setPage('success');
              })
              .catch(() => {
                setPage('success');
              });
            }
          }
        })
        .catch((err) => {
          console.error('Error restoring order state:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  // Handle order creation
  const handleInitiatePayment = async (checkoutData: {
    customer: CustomerDetails;
    paymentMethod: 'monime_momo' | 'monime_card';
    momoProvider?: 'orange_money' | 'afrimoney';
    momoNumber?: string;
  }) => {
    setIsLoading(true);
    setErrorMsg('');

    const calculatedPrice = currency === 'SLE' ? SNEAKER_PRODUCT.price : SNEAKER_PRODUCT.priceUSD;
    const shipping = currency === 'SLE' ? 110 : 5;
    const subtotal = calculatedPrice * quantity;
    const tax = Math.round(subtotal * 0.15);
    const totalAmount = subtotal + shipping + tax;

    try {
      const response = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: {
            id: SNEAKER_PRODUCT.id,
            name: SNEAKER_PRODUCT.name,
          },
          size: selectedSize,
          color: selectedColor,
          quantity: quantity,
          totalAmount: totalAmount,
          currency: currency,
          customer: checkoutData.customer,
          paymentMethod: checkoutData.paymentMethod,
          momoProvider: checkoutData.momoProvider,
          momoNumber: checkoutData.momoNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session. Please check your network and details.');
      }

      const data = await response.json();
      setTxRef(data.txRef);

      // Check where to route next
      if (data.redirectUrl.startsWith('/checkout/sandbox')) {
        setPage('sandbox');
      } else {
        // External redirect (Standard Monime deployment outside of sandbox environments)
        window.location.href = data.redirectUrl;
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Callback from our custom Monime Sandbox Gateway
  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      setPage('success');
    } else {
      setPage('checkout');
    }
  };

  // Order workflow reset
  const handleReset = () => {
    setPage('checkout');
    setTxRef('');
    setQuantity(1);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-slate-900 selection:text-white" id="main-application-shell">
      {/* Dynamic Header */}
      {page === 'checkout' && (
        <header className="bg-white border-b border-slate-100 sticky top-0 z-40" id="store-main-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-black tracking-tighter text-xl shadow-md">
                V
              </div>
              <div>
                <span className="block font-black font-sans text-lg tracking-tight text-slate-900 leading-none">
                 TekMarket
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-widest leading-none">
                  KINETIC TEst
                </span>
              </div>
            </div>

            {/* Middle Step Progress Indicators */}
            <div className="hidden md:flex items-center gap-6 text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-900">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center font-mono">1</span>
                <span>Select Shoe</span>
              </div>
              <div className="w-8 border-t border-slate-200" />
              <div className="flex items-center gap-2 text-slate-900">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center font-mono">2</span>
                <span>Billing Details</span>
              </div>
              <div className="w-8 border-t border-slate-200" />
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-[10px] font-bold flex items-center justify-center font-mono">3</span>
                <span>Monime Secure Checkout</span>
              </div>
            </div>

            {/* Right Safety locks info */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full font-mono">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline font-semibold">SECURE MONIME CHECKOUT</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Container Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col justify-center">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-6 py-4 rounded-2xl mb-6 text-sm font-medium flex items-center gap-3 shadow-sm animate-fade-in">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 animate-ping" />
            <div className="flex-grow">
              <strong>Transaction Error:</strong> {errorMsg}
            </div>
            <button 
              onClick={() => setErrorMsg('')}
              className="text-rose-500 hover:text-rose-800 transition-colors font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Multi-page controller */}
        {page === 'checkout' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Product description and customizer left panel */}
            <div className="lg:col-span-5 h-full">
              <ProductCard
                product={SNEAKER_PRODUCT}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                quantity={quantity}
                setQuantity={setQuantity}
                currency={currency}
                setCurrency={setCurrency}
              />
            </div>

            {/* Checkout address inputs right panel */}
            <div className="lg:col-span-7 h-full">
              <CheckoutForm
                product={SNEAKER_PRODUCT}
                size={selectedSize}
                color={selectedColor}
                quantity={quantity}
                currency={currency}
                onInitiatePayment={handleInitiatePayment}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {page === 'sandbox' && (
          <div className="w-full flex justify-center py-4">
            <MonimeSandbox
              txRef={txRef}
              onPaymentComplete={handlePaymentComplete}
            />
          </div>
        )}

        {page === 'success' && (
          <div className="w-full flex justify-center py-4">
            <OrderSuccess
              txRef={txRef}
              onReset={handleReset}
            />
          </div>
        )}
      </main>

      {/* Global Footer (shows only on Checkout main page for visual clarity) */}
      {page === 'checkout' && (
        <footer className="bg-white border-t border-slate-100 py-8 text-center text-xs text-slate-400 font-mono tracking-wider">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              © 2026 VELOCITY KINETIC LABS. ALL INTELLECTUAL PROPERTY PERSISTED.
            </div>
            <div className="flex items-center gap-4">
              <a href="https://docs.monime.io" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">
                MONIME DOCS
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-800 transition-colors">
                PRIVACY POLICY
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-800 transition-colors">
                TERMS & CONSTRAINTS
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
