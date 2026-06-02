// server.js — Deploy this separately (Render, Railway, Vercel, Heroku, etc.)
// GitHub Pages only serves static files — this CANNOT run there.
//
// Steps to go live:
//   1. Create a free account at https://render.com (or railway.app)
//   2. Deploy this file as a Node.js web service
//   3. Set env var STRIPE_SECRET_KEY = sk_live_... (or sk_test_... for testing)
//   4. Replace SERVER_URL in app.js with your Render/Railway URL
//   5. Update success_url and cancel_url below with your real GitHub Pages URL
//
// Run locally:
//   npm install express stripe cors
//   node server.js

import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Use env var — never hardcode your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Custom Phone Build",
            description: req.body.description || "Built to order",
          },
          unit_amount: req.body.amount, // in cents
        },
        quantity: 1,
      }],
      // Replace with your actual GitHub Pages URL
      success_url: "https://YOUR_USERNAME.github.io/YOUR_REPO/success.html",
      cancel_url:  "https://YOUR_USERNAME.github.io/YOUR_REPO/index.html",
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
