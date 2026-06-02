import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe("YOUR_STRIPE_SECRET_KEY");

app.post("/create-checkout-session", async (req,res)=>{

    const session = await stripe.checkout.sessions.create({
        payment_method_types:["card"],
        mode:"payment",
        line_items:[{
            price_data:{
                currency:"usd",
                product_data:{
                    name:"Custom Phone Build"
                },
                unit_amount:req.body.amount
            },
            quantity:1
        }],
        success_url:"https://example.com/success",
        cancel_url:"https://example.com/cancel"
    });

    res.json({ url: session.url });
});

app.listen(4242, ()=>console.log("Server running on 4242"));
