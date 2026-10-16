# MyStyle AI — Phase 2 Backend & Architecture Handover for Cursor

## 1. Executive Summary

**MyStyle AI** is a premium consumer mobile & responsive web application delivering personalised fashion, beauty, smart shopping, and coordinated family styling, tailored for the South African consumer market.

Phase 1 (Frontend Prototype Development) has been built in Google AI Studio Build Mode. All client-side UI/UX flows, state handling, navigation transitions, editorial styling, and interactive demonstration features are fully functional and verified.

This handover document equips software architects and full-stack engineers continuing in **Cursor** to implement Phase 2 (production backend services, databases, authentic AI processing pipelines, real retailer integrations, and user authentication).

---

## 2. Technology Stack & Key Libraries

- **Framework**: React 18 + TypeScript 5 (Vite bundler)
- **Styling**: Tailwind CSS + Typography (`@tailwindcss/typography`)
- **Icons**: Lucide React (`lucide-react`)
- **Design System Tokens**:
  - Editorial Serifs: `font-serif` (`Playfair Display`)
  - Modern Sans: `font-sans` (`Plus Jakarta Sans`)
  - Accent Gold: `#B49361` (Warm Honey Gold)
  - Terracotta Rose: `#9C6A61`
  - Blush Base: `#E5CDBE`
  - Background Neutral: `#F6F2EC` (Warm Cream Alabaster)
  - Deep Charcoal: `#242326`
- **Current Persistence**: Browser `localStorage` with reactive cross-component broadcast events (`window.dispatchEvent(new CustomEvent(...))`).

---

## 3. Architecture & Navigation Structure

The application adopts a **5 primary bottom navigation tabs** architecture plus **internal dedicated modal hubs** for focused user journeys:

### Primary Navigation Tabs
1. **Home (`'home'`)**: Personalised greeting, editorial daily hero, style inspiration carousel, occasion shortcuts, family banner, digital wardrobe card, smart shopping preview, style DNA summary, virtual try-on spotlight, beauty section, and membership & credits banner.
2. **My Stylist (`'stylist'`)**: Conversational AI styling assistant with intent routing (occasion outfit proposals, garment pairing, beauty look consultations, family dress codes).
3. **Try On (`'try-on'`)**: Photorealistic virtual fitting room supporting full outfits, single garments, family members, pose presets, and camera/gallery uploads.
4. **Shop (`'shop'`)**: South African smart shopping price-comparison engine querying curated SA retailers (Woolworths, Foschini, Zara SA, Truworths, Superbalist) with price alerts, retailer stock indicators, and delivery filters.
5. **My Profile (`'profile'`)**: Complete 12-section customer profile dashboard covering Personal Bio, Physical & Sizing, Style DNA, Wardrobe Inventory, Beauty Preferences, Family Members, and the new Membership, AI Credits & Privacy Settings Hub.

### Internal Dedicated Subpages (Full Viewports with Breadcrumb Back Navigation)
- **`'discover'` (`DiscoverScreen.tsx`)**: Editorial collections, seasonal lookbooks, and saved customer looks with instant "Try This Look" and "Find Similar" hooks.
- **`'family'` (`FamilyStylingScreen.tsx`)**: Multi-member family coordination hub with member profiles, palette synchronizer, and occasion outfit boards.
- **`'beauty'` (`BeautyStudioScreen.tsx`)**: Hairstyles, hair colours, editorial makeup, nail art, and full occasion beauty lookbooks.
- **`'wardrobe'` (`DigitalWardrobeScreen.tsx`)**: Digitised wardrobe catalog, interactive outfit creator canvas, calendar planner, and wardrobe gap intelligence.
- **`'membership'` (`MembershipHubScreen.tsx`)**: Complete subscription & credits hub covering 7 distinct views:
  1. *My Membership*: Active plan, renewal date, card last 4, cancellation/pause.
  2. *Explore Plans*: Free Discovery, Signature (R149/mo), and Atelier (R349/mo) with monthly/annual switch.
  3. *AI Credits*: Balance meter, transparent credit costs breakdown, instant top-up packs.
  4. *Credit Usage History*: Chronological ledger with filterable activity categories.
  5. *Account Settings*: Contact details, SA regional delivery hub, phone & security.
  6. *Privacy & Data*: Ephemeral photo mode, recommendation tuning, GDPR/POPIA data export & reset.
  7. *Notification Preferences*: Channels (Push/Email/WhatsApp) and fashion alerts.

---

## 4. Key Services & Demonstration State

All data layers are isolated in `src/services/` and `src/data/` for clean backend replacement:

| Module / Service | File Path | Phase 1 Mock State | Phase 2 Backend Target |
|---|---|---|---|
| **Membership & Credits** | `src/services/membershipService.ts` | `localStorage` + simulated transactions | Stripe / PayFast / Google Play Billing / Firestore / PostgreSQL |
| **Membership Pricing Data** | `src/data/membershipData.ts` | Static ZAR pricing & cost tables | Dynamic billing API & product catalog |
| **Digital Wardrobe** | `src/services/wardrobeService.ts` | `localStorage` wardrobe items & outfits | Cloud Object Storage (S3/GCS) + Wardrobe DB |
| **Beauty Studio** | `src/services/beautyService.ts` | Curated beauty dataset & saved looks | Generative AI beauty model + Beauty catalog |
| **Family Styling** | `src/services/familyService.ts` | Local multi-member profiles & event boards | User account family sub-entities |
| **User Profile & Photos** | `src/services/profileService.ts` | `localStorage` profile with 90%+ completion | Secure Customer API + Auth session |
| **Saved Looks & Products** | `src/services/savedLooksService.ts` | Local bookmarking | User Saved Items table / collection |
| **Shopping Data** | `src/data/shopData.ts` | 24+ curated SA retail items with price history | Real-time Retailer Scraper / Affiliate Product API |

---

## 5. South African Market Grounding

- **Currency**: South African Rand (`ZAR` / `R`)
- **Retail Partners Represented**:
  - Woolworths South Africa (Premium sustainable basics & luxury cuts)
  - Foschini (Contemporary South African fashion)
  - Zara South Africa (Trend-forward global fashion)
  - Truworths (Smart formalwear & occasion wear)
  - Superbalist (Multi-brand e-commerce & streetwear)
- **Regional Hubs**:
  - Johannesburg (Gauteng)
  - Cape Town (Western Cape)
  - Durban (KwaZulu-Natal)
  - Pretoria (Gauteng)
  - Gqeberha (Eastern Cape)
- **Privacy Compliance**: Designed to adhere to South Africa's Protection of Personal Information Act (POPIA) and GDPR principles (data export, ephemeral image processing option, local processing preference).

---

## 6. Phase 2 Cursor Implementation Checklist

1. **Authentication & Identity**:
   - Integrate Firebase Auth / Supabase Auth / NextAuth supporting Google Sign-In and Phone/Email OTP.
   - Link `UserProfile` to authenticated `uid`.
2. **AI Image Generation & Try-On Pipeline**:
   - Replace simulated try-on and makeover canvases with backend worker queues calling Gemini Flash / Imagen 3 / Virtual Try-On APIs.
   - Enforce credit balance checks on the backend before dispatching generation jobs.
   - Deduct credits atomically in the transaction ledger upon completion.
3. **Payments & Subscriptions**:
   - Integrate Google Play Billing (for native Android APK distribution) and PayFast / Stripe (for web).
   - Hook webhooks to update `UserMembership.planId`, `renewsOn`, and credit monthly reloads.
4. **Photo Storage & Security**:
   - Move client Base64 uploads to private Cloud Storage buckets with signed temporary download URLs.
   - Honour user's `ephemeralPhotoMode` toggle (delete from storage immediately after generation).
5. **Real Retailer Feeds**:
   - Implement scheduled scrapers or affiliate API ingestors (Impact / 2Performant / direct retailer feeds) into PostgreSQL.
