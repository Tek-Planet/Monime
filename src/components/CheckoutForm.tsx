import React, { useState } from 'react';
import { CustomerDetails, Product } from '../types';
import { ShieldAlert, CreditCard, Smartphone, CheckCircle, Info, Send } from 'lucide-react';

interface CheckoutFormProps {
  product: Product;
  size: number;
  color: string;
  quantity: number;
  currency: 'SLE' | 'USD';
  onInitiatePayment: (details: {
    customer: CustomerDetails;
    paymentMethod: 'monime_momo' | 'monime_card';
    momoProvider?: 'orange_money' | 'afrimoney';
    momoNumber?: string;
  }) => void;
  isLoading: boolean;
}

export default function CheckoutForm({
  product,
  size,
  color,
  quantity,
  currency,
  onInitiatePayment,
  isLoading,
}: CheckoutFormProps) {
  // Customer details form state
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: 'Freetown',
    country: 'Sierra Leone',
  });

  // Selected payment method
  const [paymentMethod, setPaymentMethod] = useState<'monime_momo' | 'monime_card'>('monime_momo');
  
  // Localized mobile money states (SL-centric defaults for Monime)
  const [momoProvider, setMomoProvider] = useState<'orange_money' | 'afrimoney'>('orange_money');
  const [momoNumber, setMomoNumber] = useState('');

  // Local form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!customer.fullName.trim()) tempErrors.fullName = 'Full Name is required.';
    if (!customer.email.trim()) {
      tempErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(customer.email)) {
      tempErrors.email = 'Please enter a valid email address.';
    }
    if (!customer.phoneNumber.trim()) {
      tempErrors.phoneNumber = 'Phone Number is required.';
    }
    if (!customer.address.trim()) tempErrors.address = 'Delivery Address is required.';
    if (!customer.city.trim()) tempErrors.city = 'City is required.';

    if (paymentMethod === 'monime_momo') {
      if (!momoNumber.trim()) {
        tempErrors.momoNumber = 'Mobile Money phone number is required.';
      } else if (momoNumber.length < 8) {
        tempErrors.momoNumber = 'Please enter a valid mobile number.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onInitiatePayment({
      customer,
      paymentMethod,
      momoProvider: paymentMethod === 'monime_momo' ? momoProvider : undefined,
      momoNumber: paymentMethod === 'monime_momo' ? momoNumber : undefined,
    });
  };

  return (
    <div className="bg-slate-50 rounded-3xl border border-slate-100 shadow-sm p-8 animate-fade-in h-full flex flex-col" id="checkout-form-card">
      <div className="border-b border-slate-200 pb-5 mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center justify-between">
          <span>Secure Checkout</span>
          <span className="text-[10px] bg-black text-white px-2.5 py-0.5 rounded font-mono font-bold tracking-widest uppercase">
            SECURE
          </span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Complete your delivery and payment details to place your order.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
        {/* Delivery Information Header */}
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase mb-4">
            1. DELIVERY INFORMATION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={customer.fullName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all text-slate-850 ${
                  errors.fullName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                }`}
                placeholder="e.g. John Kamara"
                id="input-fullname"
              />
              {errors.fullName && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={customer.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all text-slate-850 ${
                  errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                }`}
                placeholder="john@example.com"
                id="input-email"
              />
              {errors.email && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={customer.phoneNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all text-slate-850 ${
                  errors.phoneNumber ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                }`}
                placeholder="+232 77 123456"
                id="input-phone"
              />
              {errors.phoneNumber && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.phoneNumber}</p>}
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                value={customer.address}
                onChange={handleInputChange}
                className={`w-full px-3 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all text-slate-850 ${
                  errors.address ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                }`}
                placeholder="e.g. 24 Wilkinson Road"
                id="input-address"
              />
              {errors.address && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={customer.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all text-slate-850"
                placeholder="Freetown"
                id="input-city"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Country
              </label>
              <select
                name="country"
                value={customer.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black transition-all cursor-pointer text-slate-850"
                id="input-country"
              >
                <option value="Sierra Leone">Sierra Leone 🇸🇱</option>
                <option value="Liberia">Liberia 🇱🇷</option>
                <option value="Guinea">Guinea 🇬🇳</option>
                <option value="Ghana">Ghana 🇬🇭</option>
                <option value="Nigeria">Nigeria 🇳🇬</option>
                <option value="United States">United States 🇺🇸</option>
                <option value="United Kingdom">United Kingdom 🇬🇧</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment Integration Header */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">
              2. SELECT PAYMENT METHOD
            </h3>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Powered by Monime
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Monime Mobile Money */}
            <button
              type="button"
              onClick={() => setPaymentMethod('monime_momo')}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-300 relative bg-white cursor-pointer ${
                paymentMethod === 'monime_momo'
                  ? 'border-2 border-black shadow-sm'
                  : 'border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
              id="payment-method-momo"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${paymentMethod === 'monime_momo' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Mobile Money</p>
                  <p className="text-[10px] text-slate-400">Orange / Afrimoney</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full flex-shrink-0 transition-all ${
                paymentMethod === 'monime_momo'
                  ? 'border-4 border-black'
                  : 'border border-slate-300'
              }`} />
            </button>

            {/* Monime Card */}
            <button
              type="button"
              onClick={() => setPaymentMethod('monime_card')}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-300 relative bg-white cursor-pointer ${
                paymentMethod === 'monime_card'
                  ? 'border-2 border-black shadow-sm'
                  : 'border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
              id="payment-method-card"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${paymentMethod === 'monime_card' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">Bank Card</p>
                  <p className="text-[10px] text-slate-400">Visa / MasterCard</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full flex-shrink-0 transition-all ${
                paymentMethod === 'monime_card'
                  ? 'border-4 border-black'
                  : 'border border-slate-300'
              }`} />
            </button>
          </div>

          {/* Conditional Payment Selection Form Fields */}
          {paymentMethod === 'monime_momo' ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in" id="momo-subform">
              {/* Operator select */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-2">
                  Select Mobile Operator
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {/* Orange Money */}
                  <button
                    type="button"
                    onClick={() => setMomoProvider('orange_money')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      momoProvider === 'orange_money'
                        ? 'bg-orange-50/55 border-2 border-orange-500 text-orange-750'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    id="provider-orange"
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Orange Money
                  </button>

                  {/* Afrimoney */}
                  <button
                    type="button"
                    onClick={() => setMomoProvider('afrimoney')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      momoProvider === 'afrimoney'
                        ? 'bg-red-50/55 border-2 border-red-500 text-red-750'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    id="provider-afrimoney"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    Afrimoney
                  </button>
                </div>
              </div>

              {/* Momo Mobile Phone */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  {momoProvider === 'orange_money' ? 'Orange Money Number' : 'Afrimoney Number'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-sm text-slate-400 font-mono font-semibold select-none">
                    +232
                  </span>
                  <input
                    type="tel"
                    value={momoNumber}
                    onChange={(e) => {
                      setMomoNumber(e.target.value.replace(/\D/g, ''));
                      if (errors.momoNumber) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.momoNumber;
                          return copy;
                        });
                      }
                    }}
                    className={`w-full pl-16 pr-4 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black font-mono transition-all ${
                      errors.momoNumber ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200'
                    }`}
                    placeholder="77XXXXXX or 88XXXXXX"
                    id="input-momo-phone"
                  />
                </div>
                {errors.momoNumber && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.momoNumber}</p>}
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  <span>USSD prompt will be triggered for authentication directly on your mobile device.</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 animate-fade-in text-center" id="card-subform">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-1">
                <CreditCard className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Tokenized Card Checkout by Monime</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Visa, MasterCard, and local cards are accepted. Upon placing order, Monime's checkout frame will launch securely.
              </p>
            </div>
          )}
        </div>

        {/* Submit Section */}
        <div className="pt-4 mt-auto">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 text-base font-bold text-white rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
              isLoading
                ? 'bg-slate-800 cursor-not-allowed opacity-85 shadow-none'
                : 'bg-black hover:bg-slate-900 shadow-slate-950/10'
            }`}
            id="button-place-order"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Initiating Payment via Monime...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-slate-300" />
                <span>Pay with Monime</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-center text-slate-400 mt-3 italic tracking-wide">
            Integration via monime.io/get-started
          </p>
        </div>
      </form>
    </div>
  );
}
