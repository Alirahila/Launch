# My Doas App: publishing package

Quranic Doas with meaning, transliteration and recitation. Premium is ₹1,299 per year.

```
app/      the installable web app (index.html, manifest, service worker, icons)
server/   the payment server (Node.js + Razorpay)
```

## 1. Set up your payment account (Razorpay)

1. Create an account at razorpay.com and complete KYC.
2. In the Razorpay Dashboard, add your settlement bank account (account number and IFSC) in the bank account / settlement settings. This is how money reaches your account. **Do not put the account number in the app or the server code.**
3. Start in **Test Mode** and switch to Live when everything works.

## 2. Choose how the app takes payment

**Option A: hosted payment link (no server)**

1. In the Dashboard, create a yearly plan of ₹1,299 and generate a **Subscription Link** from it (or create a **Payment Link** for ₹1,299 if you want a one-time yearly payment).
2. In `app/index.html`, paste the link: `subscribeUrl:'https://...'`
3. Subscribe now opens that payment page. After paying, the customer taps "I have paid, unlock Premium". If your link is set to return to the hosted app, Premium also unlocks automatically after payment.
4. The app cannot check payments in this mode, so unlocking is on the honour system. Anyone could unlock without paying.

**Option B: server-verified checkout (recommended)**

```
cd server
cp .env.example .env      # fill in your keys, never share .env
npm install
npm start
```

Deploy the server to any Node host (Render, Railway, Fly.io, a VPS) and set the same values as environment variables. The price is fixed on the server (`PRICE_INR` in `server.js`), so a user cannot change the amount. Every payment signature is verified before Premium unlocks.

In `app/index.html`, set `api:{baseUrl:'https://YOUR-SERVER'}` and add your app's web address to `ALLOWED_ORIGINS` on the server. Optionally add a webhook in the Dashboard for `payment.captured` pointing to `https://YOUR-SERVER/api/webhook`, with its secret in `RAZORPAY_WEBHOOK_SECRET`.

If both are set, Option B is used. With neither, the app runs in demo mode and no money is taken.

Either way, host the `app/` folder over HTTPS (Netlify, Cloudflare Pages, GitHub Pages) and test a full payment in Test Mode before going live. Opening `https://YOUR-APP-ADDRESS/#premium` opens the Premium screen directly, which is handy for sharing.

## 3. Receipts

- **Customers** get their payment confirmation from the payment provider by email or SMS, based on the contact details they enter. Check the customer notification settings in your Dashboard.
- **You** see every payment (ID, amount, method, customer contact) in the Dashboard under Transactions, and you can download payment and settlement reports there.
- **Your bank statement** shows the settlements Razorpay pays out. These are batched, so one credit covers several payments.
- If you are GST registered or need formal invoices, issue them with Razorpay's invoicing tools or your accounting software. Check the requirements with an accountant.

## 4. Google Play (and other Android stores)

1. Go to pwabuilder.com, enter your hosted app address, and choose **Package for stores, Android**. It produces a signed Android App Bundle (.aab). Keep the signing key safe.
2. Create a Google Play Console developer account (one-time registration fee), create the app, and upload the .aab.
3. You will need a privacy policy web address, the Data safety form, a content rating and store screenshots.
4. **Payments policy:** Google Play generally requires Google Play Billing for digital subscriptions sold inside apps distributed on Play, with exceptions that vary by region. Razorpay Checkout in the Play build may be rejected. Read the current Payments policy before submitting. Play Billing can be used from this kind of package through the Digital Goods API.
5. The same package can usually be submitted to other Android stores (for example Samsung Galaxy Store) under each store's rules. The Apple App Store needs a separate build and has its own billing rules.

## Notes

- Premium status is stored on the device. Without user accounts, it does not follow someone to a new phone, and a determined user can bypass a purely local check. Add sign-in and a server-side entitlement check if this matters to you.
- The server was tested here for signature checking only. Test the full flow against Razorpay in Test Mode before going live.
