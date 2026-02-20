# Ignite Studios - Premium Property Portal

A modern property reservation portal built with React, TypeScript, Vite, Supabase, and integrated with Zoho CRM and PayFast payment gateway.

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **CRM Integration**: Zoho CRM API
- **Payment Gateway**: PayFast
- **Deployment**: Vercel

## 📁 Project Structure

```
ignite-studios/
├── components/          # React components
├── services/           # Business logic & API services
├── supabase/
│   └── functions/      # Edge Functions (submit-reservation, payment-webhook)
├── config.ts           # App configuration
├── constants.ts         # Mock data & constants
├── types.ts            # TypeScript type definitions
└── App.tsx             # Main application component
```

## 🔧 Development

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Zoho CRM account with API access
- PayFast account (sandbox or production)

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   - Set up Supabase project and get credentials
   - Configure Zoho CRM API credentials
   - Set up PayFast merchant credentials

3. **Run development server**:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3000`

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📦 Deployment

### Deploy to Vercel

```bash
npm run deploy
```

Or use Vercel CLI:
```bash
vercel --prod
```

### Supabase Edge Functions

Deploy Edge Functions via Supabase Dashboard:
1. Go to Edge Functions section
2. Create/update functions: `submit-reservation`, `payment-webhook`, `create-lead`
3. Set required secrets (Zoho credentials, PayFast credentials)

See `supabase/functions/README.md` for detailed setup instructions.

## 🔐 Required Secrets (Supabase Edge Functions)

**Zoho CRM:**
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_API_DOMAIN` (default: "com")

**PayFast:**
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_ENV` ("sandbox" or "production")

## 📝 Features

- Property inventory management
- User authentication (Supabase Auth)
- Reservation system with payment integration
- Zoho CRM synchronization
- Admin panel for unit management
- Wishlist functionality
- Responsive design

## 📄 License

© 2026 Ignite Studios
