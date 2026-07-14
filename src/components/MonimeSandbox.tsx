import React, { useState, useEffect } from 'react';
import { ShieldCheck, Smartphone, CreditCard, Lock, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

interface MonimeSandboxProps {
  txRef: string;
  onPaymentComplete: (success: boolean) => void;
}

export default function MonimeSandbox({ txRef, onPaymentComplete }: MonimeSandboxProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'pay_select' | 'processing' | 'momo_ussd_push' | 'card_otp' | 'completed' | 'failed'>('pay_select');
  const [progressMsg, setProgressMsg] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [selectedMomoNumber, setSelectedMomoNumber] = useState('');
  
  // Card local state
  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    // Fetch order details from server
    fetch(`/api/orders/${txRef}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setSelectedMomoNumber(data.momoNumber || data.customer?.phoneNumber || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [txRef]);

  const runProcessingTimeline = (finalStep: 'momo_ussd_push' | 'card_otp') => {
    setStep('processing');
    const messages = [
      'Establishing secure token connection with Monime...',
      'Encrypting payment session...',
      order?.paymentMethod === 'monime_momo' 
        ? `Requesting direct bill via ${order?.momoProvider === 'orange_money' ? 'Orange Money' : 'Afrimoney'} network...`
        : 'Authorizing credit card credentials through payment rails...'
    ];

    let i = 0;
    setProgressMsg(messages[0]);
    
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) {
        setProgressMsg(messages[i]);
      } else {
        clearInterval(interval);
        setStep(finalStep);
      }
    }, 1200);
  };

  const handleMomoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runProcessingTimeline('momo_ussd_push');
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNo || !cardExpiry || !cardCvv || !cardName) return;
    runProcessingTimeline('card_otp');
  };

  const handleConfirmUSSD = async () => {
    setStep('processing');
    setProgressMsg('Awaiting carrier response... Checking authentication signature...');
    
    setTimeout(async () => {
      try {
        // Complete payment on server
        const confirmRes = await fetch(`/api/orders/${txRef}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: 'completed',
            momoNumber: selectedMomoNumber,
          }),
        });
        
        if (confirmRes.ok) {
          setStep('completed');
          setProgressMsg('Payment successfully captured! Redirecting back to merchant...');
          setTimeout(() => {
            onPaymentComplete(true);
          }, 1500);
        } else {
          setStep('failed');
        }
      } catch (err) {
        console.error(err);
        setStep('failed');
      }
    }, 1500);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setProgressMsg('Authenticating 3D Secure verification... Settling transactions...');
    
    setTimeout(async () => {
      try {
        const confirmRes = await fetch(`/api/orders/${txRef}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: 'completed',
          }),
        });
        
        if (confirmRes.ok) {
          setStep('completed');
          setProgressMsg('Payment authorized! Shipping protocol initiated...');
          setTimeout(() => {
            onPaymentComplete(true);
          }, 1500);
        } else {
          setStep('failed');
        }
      } catch (err) {
        console.error(err);
        setStep('failed');
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-slate-900 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Loading Monime Checkout Session...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-950 mb-2">Checkout Session Invalid</h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6">This transaction could not be located on the server. Please return and place a new checkout order.</p>
        <button 
          onClick={() => onPaymentComplete(false)}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Checkout</span>
        </button>
      </div>
    );
  }

  const isMomo = order.paymentMethod === 'monime_momo';
  const displayCurrency = order.currency === 'SLE' ? 'Le ' : '$';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8 font-sans" id="monime-sandbox-gateway">
      {/* Sandbox Warn Banner */}
      <div className="w-full max-w-md bg-slate-50 border border-slate-200 text-slate-800 px-5 py-3 rounded-2xl mb-4 text-xs font-medium flex items-center gap-3 shadow-sm">
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
        <div>
          <span className="font-bold">Monime Sandbox Mode:</span> Perfect for testing payment flows in the preview browser. No real funds will be charged.
        </div>
      </div>

      {/* Main Checkout Container */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Monime Branded Header */}
        <div className="bg-black px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <div className="w-3.5 h-3.5 bg-black rotate-45"></div>
            </div>
            <span className="text-base font-bold font-sans tracking-tight uppercase">monime</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>SECURE 256-BIT</span>
          </div>
        </div>

        {/* Merchant Store details box */}
        <div className="bg-slate-50 border-b border-slate-150 p-6 flex justify-between items-center text-sm">
          <div>
            <span className="text-[10px] text-slate-400 font-mono font-bold tracking-widest block">MERCHANT</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              Velocity Kinetics
              <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
            </span>
            <span className="text-xs text-slate-400 font-mono mt-0.5 block">Ref: {txRef}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono font-bold tracking-widest block">AMOUNT DUE</span>
            <span className="text-xl font-extrabold text-black font-sans">
              {displayCurrency}{order.totalAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block uppercase">{order.currency}</span>
          </div>
        </div>

        {/* Dynamic Sandbox Steps */}
        <div className="p-8 flex-grow">
          {step === 'pay_select' && (
            <div className="space-y-6">
              {isMomo ? (
                /* Momo Checkout Form */
                <form onSubmit={handleMomoSubmit} className="space-y-5">
                  <div className="text-center mb-4">
                    <div className="inline-flex p-3 rounded-2xl bg-slate-50 border border-slate-150 mb-2">
                      <Smartphone className="w-5 h-5 text-black" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Mobile Money Checkout
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Authenticate with your {order.momoProvider === 'orange_money' ? 'Orange Money' : 'Afrimoney'} account.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Confirm Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-sm text-slate-400 font-mono font-semibold">+232</span>
                      <input
                        type="text"
                        required
                        value={selectedMomoNumber}
                        onChange={(e) => setSelectedMomoNumber(e.target.value)}
                        className="w-full pl-16 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black font-mono text-slate-850"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Send USSD Push Prompt</span>
                  </button>
                </form>
              ) : (
                /* Card Checkout Form */
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex p-3 rounded-2xl bg-slate-50 border border-slate-150 mb-2">
                      <CreditCard className="w-5 h-5 text-black" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Credit / Debit Card Checkout
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Pay instantly with standard Visa, MasterCard or local bank cards.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. John Kamara"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black text-slate-850"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNo}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        let match = val.match(/\d{1,4}/g);
                        setCardNo(match ? match.join(' ') : val);
                      }}
                      placeholder="4000 1234 5678 9010"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black font-mono text-slate-850"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 2) {
                            setCardExpiry(val.slice(0, 2) + '/' + val.slice(2, 4));
                          } else {
                            setCardExpiry(val);
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black font-mono text-slate-850"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black font-mono text-slate-850"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    <span>Secure Checkout With Card</span>
                  </button>
                </form>
              )}

              <div className="flex justify-center items-center gap-1.5 text-xs text-slate-400 mt-2">
                <ShieldCheck className="w-4 h-4 text-slate-900" />
                <span>Monime secured payment gateway</span>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8 space-y-6 flex flex-col items-center justify-center">
              <div className="relative">
                <Loader2 className="w-14 h-14 text-black animate-spin" />
                <div className="absolute inset-0 m-auto w-6 h-6 bg-black rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                  m
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-800">Processing Payment...</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-mono">
                  {progressMsg}
                </p>
              </div>
            </div>
          )}

          {step === 'momo_ussd_push' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 border-l-4 border-l-black">
                <span className="block text-xs font-bold text-black font-mono tracking-widest uppercase mb-1.5">
                  SIMULATION OVERLAY
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A bill prompt has been dispatched to phone <strong className="font-mono text-black">+232 {selectedMomoNumber}</strong>. Enter your mock security PIN code to confirm authorization.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Enter Mobile Money PIN (4 digits)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full text-center tracking-widest text-lg font-bold px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono text-slate-850"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('pay_select')}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUSSD}
                    className="w-2/3 py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Authorize Payment</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'card_otp' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 border-l-4 border-l-black">
                <span className="block text-xs font-bold text-black font-mono tracking-widest uppercase mb-1.5">
                  3D SECURE AUTHENTICATION
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Monime has sent a simulated OTP code to <strong className="font-mono text-black">{order.customer?.email}</strong>. Use the pre-filled mock credentials below to authorize the transaction.
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Simulated One-Time Password (OTP)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-lg font-bold px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono text-slate-850"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('pay_select')}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Submit Verification Code</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'completed' && (
            <div className="text-center py-8 space-y-5 flex flex-col items-center justify-center animate-fade-in">
              <div className="w-16 h-16 bg-slate-50 rounded-full border border-slate-150 flex items-center justify-center text-black">
                <ShieldCheck className="w-9 h-9 fill-slate-200" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-extrabold text-black font-sans tracking-tight">Payment Successfully Secured!</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {progressMsg}
                </p>
              </div>
            </div>
          )}

          {step === 'failed' && (
            <div className="text-center py-8 space-y-5 flex flex-col items-center justify-center animate-fade-in">
              <div className="w-16 h-16 bg-slate-50 rounded-full border border-slate-150 flex items-center justify-center text-black">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-900">Payment Authorization Failed</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  The checkout transaction was cancelled or failed network validation. Please retry or choose another billing method.
                </p>
              </div>
              <button
                onClick={() => setStep('pay_select')}
                className="px-5 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Retry Checkout Method
              </button>
            </div>
          )}
        </div>

        {/* Brand footer */}
        <div className="bg-slate-50 border-t border-slate-150 px-6 py-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>MONIME SIMULATION SERVICE</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
            LIVE PROTOTYPE
          </span>
        </div>
      </div>
    </div>
  );
}
