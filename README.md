# AUREL Fine Jewellery

A complete, light-luxury jewellery commerce frontend. The campaign storefront, atelier admin workspace, and protected digital purchase certificate share persistent demo state.

## Run

- Install dependencies with `npm install`.
- Start the development server with `npm run dev`.
- Create the production build with `npm run build`.
- Preview the production build with `npm run preview`.

The existing Vite configuration and package scripts are preserved. Tailwind CSS v4 is configured through the Vite plugin and the CSS-first `@theme` block in `src/index.css`; a legacy `tailwind.config.js` is not needed.

## Try the Complete Journey

1. Open `/shop`, choose a piece, select its size, and add it to the bag.
2. Open `/checkout`. Use **Use Demo Details**, choose delivery and a simulated payment method, and place the order.
3. The confirmation page links to the new order in the admin workspace. You can also open `/admin/orders`.
4. Sign in with `admin@jewellerydemo.com` and `admin123`. The login page can fill these demo credentials for you.
5. Open the order and choose **Confirm Order**.
6. Choose **Generate Digital Business Card**. A unique card ID, browser-origin URL, and real SVG QR code are created.
7. Choose **View Card**. The public URL opens verification, without showing customer information.
8. Enter `123456`. The protected purchase certificate reveals customer, order, payment, and store information.
9. Lock the certificate to require another verification. Revoke or regenerate it in the admin workspace to invalidate its previous link.

The seeded orders also let you explore the admin immediately without checking out first.

## Included

- Ten realistic products and ten local, custom-generated campaign/product images.
- Responsive editorial homepage, GSAP preloader, parallax, marquee, masked image reveals, and magnetic CTA.
- Search, category/material/collection/price/availability filters, sorting, wishlist, quick view, gallery zoom, and size guide.
- Persistent bag drawer and cart, quantities, customer validation, standard/express delivery, and simulated UPI/card/COD payments.
- Persistent order confirmation and history with status timelines.
- Demo admin authentication, live order-derived Recharts analytics, order search/filter/export, customer records, catalog editing, and settings.
- Order confirmation, card creation, QR code generation, clipboard sharing, regeneration, revocation, and expiration handling.
- Six-digit OTP entry with paste/autofill, keyboard navigation, error feedback, guarded verified routes, and 10-minute tab-local verification.
- Focus-trapped dialogs, Escape dismissal, restored focus, semantic controls, screen-reader announcements, and reduced-motion handling.
- Dedicated mobile layouts at 680px and tablet adaptations at 900px/980px, with wide-screen layouts at 1700px.

## Architecture

- `src/App.tsx`: route trees, providers, error boundary, and lazy admin entry points.
- `src/contexts/CommerceContext.tsx`: Cart, Order, Card, and Store contexts.
- `src/contexts/AuthContext.tsx`: replaceable, session-local demo admin authentication.
- `src/contexts/UIContext.tsx`: bag, quick view, and toast state.
- `src/services/demo.ts`: isolated mock auth, OTP, and payment adapters.
- `src/data/products.ts` and `src/data/demo.ts`: typed catalog and sample orders.
- `src/components/`: reusable controls, overlays, navigation, product components, and synchronized motion.
- `src/pages/admin/`: separate atelier dashboard and management views.
- `src/pages/DigitalCard.tsx`: verification, route guards, certificate, and unavailable state.
- `src/styles/`: commerce, admin, and certificate visual systems.
- `public/images/`: local JPEG assets. Product images are lazy-loaded; campaign photography is prioritized.

GSAP owns campaign and scroll motion; Framer Motion owns interactive overlays and micro-interactions. Lenis uses GSAP's ticker with `autoRaf: false`, synchronizes ScrollTrigger, preserves native touch scrolling, pauses behind overlays, and cleans up on unmount.

## Routes

Storefront: `/`, `/shop`, `/product/:id`, `/cart`, `/checkout`, `/order-success`, `/orders`, `/about`, `/journal`, `/journal/:slug`, `/care`.

Admin: `/admin`, `/admin/login`, `/admin/orders`, `/admin/orders/:id`, `/admin/cards`, `/admin/cards/:id`, `/admin/customers`, `/admin/products`, `/admin/analytics`, `/admin/settings`.

Cards: `/card/:cardId`, `/card/:cardId/verify`, `/card/:cardId/verified`, `/card/:cardId/invalid`.

## Demo Boundaries

This is not a production authentication, payment, or certificate service. Use fictitious information only. No payment is processed and no order or OTP email/SMS is sent.

The QR contains only the card URL, never customer data. All records remain in this browser's localStorage. Consequently a generated link works in another tab on the same origin/browser, but cannot retrieve its record on another device or browser. The unavailable screen explains this limitation. Real cross-device sharing requires server-side records, access control, rate limiting, and a real OTP delivery service.

The verified route checks active card status and a 10-minute sessionStorage grant. These are demonstration guards, not a security boundary against someone with access to developer tools. Demo admin credentials and OTP are intentionally public.

Catalog edits affect current storefront prices and availability; completed orders retain purchase-time item snapshots. COD payments can be marked as received in the admin. Charts use actual stored order data, not fabricated KPI counts.

Clear this site's localStorage and sessionStorage to reset the demo. Google Fonts is the only externally loaded visual dependency; jewellery images are local.

## Verification

The production bundle was verified with the provided build tool. Browser-driven end-to-end and visual viewport tests were not available in the coding environment.

Manual acceptance checklist: exercise the full journey above, reload cart/orders/cards to check persistence, try an incorrect OTP, try a direct `/verified` URL without a grant, revoke a verified card from a second tab, regenerate a QR and open the old link, test COD and express shipping, edit a price/availability, and check layouts at 375px, 768px, 1440px, and 1920px with keyboard and reduced-motion settings.

For static deployment, the included `public/_redirects` supplies a Netlify-style SPA fallback. Other hosts must rewrite application routes to `index.html`.