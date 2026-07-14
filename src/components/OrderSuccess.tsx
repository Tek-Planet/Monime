import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, Printer, Calendar, Clock, MapPin, Truck, RefreshCw, ShoppingBag, Phone, ArrowLeft } from 'lucide-react';

const shoeImg = "/src/assets/images/velocity_pro_sneaker_1784039390019.jpg";

interface OrderSuccessProps {
  txRef: string;
  onReset: () => void;
}

export default function OrderSuccess({ txRef, onReset }: OrderSuccessProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${txRef}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [txRef]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-xl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mb-3" />
        <p className="text-slate-500 font-medium">Retrieving Order Invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-xl text-center">
        <p className="text-rose-500 font-bold text-lg mb-2">Order Not Found</p>
        <p className="text-slate-500 text-sm max-w-sm mb-6">We could not pull the invoice details for reference "{txRef}" from our servers.</p>
        <button onClick={onReset} className="px-6 py-3 bg-slate-950 text-white font-bold rounded-xl hover:bg-slate-900 transition-all">
          Back to Store
        </button>
      </div>
    );
  }

  const isMomo = order.paymentMethod === 'monime_momo';
  const displayCurrency = order.currency === 'SLE' ? 'Le ' : '$';
  
  // Confetti / ripple state
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-12" id="order-success-screen">
      {/* Top Banner Success card */}
      <div className="bg-black text-white rounded-2xl p-8 md:p-10 text-center relative overflow-hidden shadow-sm">
        <div className="relative z-10 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <div className="space-y-2">
            <span className="text-slate-400 font-mono text-[10px] font-bold tracking-widest uppercase">
              PAYMENT SECURED BY MONIME
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tight uppercase">
              Order Confirmed
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Thank you for your order. We’ve received your payment via{' '}
              <strong className="text-white">
                {isMomo ? `${order.momoProvider === 'orange_money' ? 'Orange Money' : 'Afrimoney'}` : 'Credit Card'}
              </strong>{' '}
              and are preparing your delivery coordinates.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-mono text-slate-300 uppercase tracking-wider">
            <span>REF:</span>
            <span className="font-bold text-white select-all">{txRef}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Shipping timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left column (3 spans): Receipt details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Order Details box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight mb-5 flex items-center justify-between">
              <span>Order Receipt</span>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">ID: {order.id}</span>
            </h3>

            {/* Product description block */}
            <div className="flex gap-4 items-center border-b border-slate-100 pb-5 mb-5">
              <div className="w-20 h-20 bg-slate-50 border border-slate-150 rounded-xl p-2 flex-shrink-0 flex items-center justify-center">
                <img
                  src={shoeImg}
                  alt="Sneaker Product"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="flex-grow">
                <span className="text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase block">
                  VELOCITY ATHLETICS
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  Velocity Pulse-90 Sneaker
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Size: {order.size} • ColorWay: {order.color} • Qty: {order.quantity}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-bold text-slate-900 font-sans">
                  {displayCurrency}{(order.totalAmount - (order.currency === 'SLE' ? 110 : 5) - Math.round(order.totalAmount * 0.15)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Cost Breakdowns list */}
            <div className="space-y-3 pb-5 border-b border-slate-100 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal</span>
                <span className="font-mono text-slate-800">
                  {displayCurrency}
                  {(order.totalAmount - (order.currency === 'SLE' ? 110 : 5) - Math.round(order.totalAmount * 0.15)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Shipping</span>
                <span className="font-mono text-slate-800">
                  {displayCurrency}
                  {order.currency === 'SLE' ? '110' : '5'}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST Tax (15%)</span>
                <span className="font-mono text-slate-800">
                  {displayCurrency}
                  {Math.round(order.totalAmount * 0.15).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Paid Total summary */}
            <div className="pt-4 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-bold text-slate-900">Total Paid</span>
                <span className="text-xs text-slate-400 block mt-0.5">Charged via Monime Gateway</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-black font-sans">
                  {displayCurrency}{order.totalAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block uppercase">{order.currency}</span>
              </div>
            </div>
          </div>

          {/* Delivery coordinates box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight mb-2">
              Delivery Destination
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-black mt-1 flex-shrink-0" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-0.5">ADDRESS</span>
                  <p className="font-semibold text-slate-850 leading-snug">{order.customer?.fullName}</p>
                  <p className="text-slate-500 leading-snug mt-0.5">{order.customer?.address}</p>
                  <p className="text-slate-500 leading-snug">{order.customer?.city}, {order.customer?.country}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-black mt-1 flex-shrink-0" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-0.5">CONTACTS</span>
                  <p className="font-semibold text-slate-850">{order.customer?.phoneNumber}</p>
                  <p className="text-slate-500 mt-0.5">{order.customer?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column (2 spans): Tracking Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight mb-5 flex items-center justify-between">
              <span>Delivery Status</span>
              <span className="text-[10px] bg-black text-white font-mono font-bold tracking-widest px-2.5 py-0.5 rounded">
                ACTIVE
              </span>
            </h3>

            {/* Timeline List */}
            <div className="relative border-l border-slate-200 ml-3.5 space-y-8 pb-1">
              {/* Event 1: Payment Confirmed (Active) */}
              <div className="relative">
                <div className="absolute -left-[19px] top-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="pl-6 leading-tight">
                  <span className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">STEP 1</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Payment Confirmed</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Invoice secured on {orderDate} via Monime core.
                  </p>
                </div>
              </div>

              {/* Event 2: Sorting (Active/In progress) */}
              <div className="relative animate-pulse">
                <div className="absolute -left-[19px] top-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                </div>
                <div className="pl-6 leading-tight">
                  <span className="block text-[10px] font-bold text-black font-mono tracking-wider uppercase">STEP 2</span>
                  <h4 className="text-sm font-bold text-black mt-0.5">Processing Order</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Our Freetown hub is pairing your shoe package and testing kinetic response variables.
                  </p>
                </div>
              </div>

              {/* Event 3: Out for Delivery (Pending) */}
              <div className="relative opacity-40">
                <div className="absolute -left-[19px] top-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="pl-6 leading-tight">
                  <span className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">STEP 3</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Shipped / Dispatched</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Package handed over to Freetown local express courier/DHL priority.
                  </p>
                </div>
              </div>

              {/* Event 4: Complete (Pending) */}
              <div className="relative opacity-40">
                <div className="absolute -left-[19px] top-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="pl-6 leading-tight">
                  <span className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">STEP 4</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Delivery Complete</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Est. delivery timeframe: <strong className="font-sans text-slate-700">1-2 Days</strong> (Freetown) or 5-7 Days (International).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.print()}
              className="w-full py-3 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:border-black transition-colors shadow-sm cursor-pointer animate-fade-in"
              id="print-receipt-btn"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice Receipt</span>
            </button>
            <button
              onClick={onReset}
              className="w-full py-4 bg-black text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-850 transition-colors cursor-pointer"
              id="continue-shopping-btn"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span>Buy Again / Continue Shopping</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
