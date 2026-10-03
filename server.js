/* My Doas App payment server (Razorpay).
   Creates the order at a price the SERVER controls, then verifies the payment signature.
   Your bank account is linked inside the Razorpay Dashboard, never in this code. */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const { verifyPayment, verifyWebhook } = require('./verify');

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  ALLOWED_ORIGINS = '',
  PORT = 3000,
} = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (see .env.example).');
  process.exit(1);
}

const PRICE_INR = 1299;               // annual price. Change here and in the app's CONFIG.
const AMOUNT_PAISE = PRICE_INR * 100; // Razorpay amounts are in paise

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
const app = express();

const allowed = ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : true }));

/* Webhook: needs the raw body, so it is registered before express.json() */
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const ok = verifyWebhook(req.body, req.get('X-Razorpay-Signature'), RAZORPAY_WEBHOOK_SECRET);
  if (!ok) return res.status(400).send('Invalid signature');
  const event = JSON.parse(req.body.toString('utf8'));
  if (event.event === 'payment.captured') {
    const p = event.payload.payment.entity;
    console.log('Payment captured:', p.id, p.amount / 100, p.currency); // store this in your database
  }
  res.json({ received: true });
});

app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/create-order', async (_req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: AMOUNT_PAISE,
      currency: 'INR',
      receipt: 'doas_' + Date.now(),
      notes: { plan: 'annual' },
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('create-order failed:', err);
    res.status(500).json({ error: 'Could not start the payment. Please try again.' });
  }
});

app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details' });
  }
  if (!verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature, RAZORPAY_KEY_SECRET)) {
    return res.status(400).json({ error: 'The payment could not be verified' });
  }
  res.json({ ok: true });
});

app.listen(PORT, () => console.log('My Doas App payment server running on port ' + PORT));
