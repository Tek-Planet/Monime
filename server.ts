import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory order storage
const ordersMap = new Map<string, any>();

// Seed a demo order if needed
ordersMap.set('DEMO_REF_123', {
  id: 'order_123',
  productId: 'velocity-pulse-90',
  size: 10,
  color: 'Electric Orange',
  quantity: 1,
  totalAmount: 200, // in SLE
  currency: 'SLE',
  customer: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phoneNumber: '+232 77 123456',
    address: '15 Siaka Stevens St',
    city: 'Freetown',
    country: 'Sierra Leone',
  },
  paymentStatus: 'completed',
  paymentMethod: 'monime_momo',
  momoProvider: 'orange_money',
  txRef: 'DEMO_REF_123',
  createdAt: new Date().toISOString(),
});

// --- API ROUTES ---

// Initiate checkout
app.post('/api/checkout/initiate', async (req, res) => {
  try {
    const { product, size, color, quantity, totalAmount, currency, customer, paymentMethod, momoProvider, momoNumber } = req.body;

    if (!customer || !customer.fullName || !customer.email || !customer.phoneNumber) {
      return res.status(400).json({ error: 'Missing required customer details.' });
    }

    const txRef = 'MONIME_TX_' + Math.random().toString(36).substring(2, 11).toUpperCase();
    
    // Store order as pending
    const newOrder = {
      id: 'ord_' + Math.random().toString(36).substring(2, 9),
      productId: product.id,
      size,
      color,
      quantity,
      totalAmount,
      currency,
      customer,
      paymentStatus: 'pending',
      paymentMethod,
      momoProvider,
      momoNumber,
      txRef,
      createdAt: new Date().toISOString(),
    };

    ordersMap.set(txRef, newOrder);

    // If a Monime API Key is configured, attempt to hit the real API
    const apiKey = process.env.MONIME_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey !== 'MY_APP_URL') {
      try {
        // According to standard payment requests, construct the payment object
        // Monime API typically creates a checkout session link
        // Base: https://api.monime.io/v1/payments
        const monimePayload = {
          amount: totalAmount,
          currency: currency || 'SLE',
          reference: txRef,
          description: `Payment for ${product.name} (Size: ${size}, Qty: ${quantity})`,
          redirect_url: `${process.env.APP_URL || `http://localhost:${PORT}`}/checkout/verify?txRef=${txRef}`,
          customer: {
            name: customer.fullName,
            email: customer.email,
            phone: customer.phoneNumber,
          },
          metadata: {
            size,
            color,
            productId: product.id,
          }
        };

        const response = await fetch('https://api.monime.io/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(monimePayload),
        });

        if (response.ok) {
          const data = await response.json();
          // Assuming data returns a checkout/payment redirect URL in some property (e.g. data.checkoutUrl or data.data.checkoutUrl)
          const redirectUrl = data.checkoutUrl || data.url || data.data?.checkoutUrl || data.data?.url;
          if (redirectUrl) {
            return res.json({
              status: 'success',
              redirectUrl: redirectUrl,
              txRef: txRef,
            });
          }
        }
        
        console.warn('Monime API returned error status or no redirect URL. Falling back to sandbox simulator.', await response.text());
      } catch (err) {
        console.error('Error calling Monime API, falling back to sandbox:', err);
      }
    }

    // Graceful fallback to built-in Sandbox visual simulator (critical for iframe friendliness)
    const sandboxUrl = `/checkout/sandbox?txRef=${txRef}`;
    return res.json({
      status: 'success',
      redirectUrl: sandboxUrl,
      txRef: txRef,
      message: 'Running in sandbox simulation mode',
    });

  } catch (error: any) {
    console.error('Checkout initiation failed:', error);
    res.status(500).json({ error: 'Server error during checkout initiation' });
  }
});

// Fetch Order Status
app.get('/api/orders/:txRef', (req, res) => {
  const { txRef } = req.params;
  const order = ordersMap.get(txRef);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

// Confirm Payment (from Webhook or Sandbox completion)
app.post('/api/orders/:txRef/confirm', (req, res) => {
  const { txRef } = req.params;
  const { paymentStatus, momoProvider, momoNumber } = req.body;
  
  const order = ordersMap.get(txRef);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.paymentStatus = paymentStatus || 'completed';
  if (momoProvider) order.momoProvider = momoProvider;
  if (momoNumber) order.momoNumber = momoNumber;
  
  ordersMap.set(txRef, order);
  res.json({ success: true, order });
});

// Webhook endpoint for Monime
app.post('/api/webhooks/monime', (req, res) => {
  // A real webhook listener to process events from Monime
  const event = req.body;
  console.log('Received Monime Webhook:', event);
  
  // Example verification pattern
  // Check signature, extract reference
  const reference = event.reference || event.data?.reference;
  const status = event.status || event.data?.status;
  
  if (reference && ordersMap.has(reference)) {
    const order = ordersMap.get(reference);
    if (status === 'success' || status === 'completed' || status === 'PAID') {
      order.paymentStatus = 'completed';
    } else if (status === 'failed' || status === 'FAILED') {
      order.paymentStatus = 'failed';
    }
    ordersMap.set(reference, order);
    return res.status(200).json({ received: true });
  }
  
  res.status(400).json({ error: 'Order reference not matched' });
});


// --- VITE DEV / PRODUCTION STATIC ROUTING ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
