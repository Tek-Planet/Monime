# MiBuks - Business Management Hub

A comprehensive business management platform designed to help small and medium-sized businesses manage their operations, finances, and growth. MiBuks provides powerful tools for sales tracking, inventory management, customer relationships, and financial reporting.

## 🌟 Features

### Core Business Management
- **Dashboard Analytics**: Real-time insights into business performance with revenue tracking and key metrics
- **Sales Management**: Record and track sales transactions with customer linking
- **Invoice Management**: Create, send, and manage invoices with multiple status tracking
- **Customer Management**: Maintain customer records with credit tracking and birthday reminders
- **Inventory Control**: Track stock levels, manage products, and receive low-stock alerts
- **Supplier Management**: Manage supplier relationships and payment tracking
- **Expense Tracking**: Record and categorize business expenses with detailed reporting

### Financial Features
- **Credit Management**: Track customer credit balances and transactions
- **Payment Processing**: Support for multiple payment methods (cash, bank transfer, mobile money)
- **Financial Reports**: Comprehensive reporting on sales, expenses, and profitability
- **Tax Management**: Built-in tax rate configuration and calculations

### Team Collaboration
- **Multi-user Support**: Invite team members with customizable page access
- **Role-based Access**: Control what pages and features each team member can access
- **Activity Logging**: Track all user actions for accountability and audit trails

### NGO & Loan Programs
- **Loan Applications**: Apply for business loans with automated risk assessment
- **Credit Scoring**: Built-in credit score calculation based on business performance
- **Loan Management**: Track loan disbursements, repayments, and schedules
- **NGO Partnership**: Support for NGO-managed microlending programs

### Admin Features
- **System Administration**: Platform-wide user and business management
- **NGO Management**: Create and manage NGO organizations and their loan programs
- **Activity Monitoring**: View all platform activity and user actions
- **User Management**: Manage user accounts and delete users when necessary

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type-safe development
- **React Router** for seamless navigation
- **TanStack Query** for efficient data fetching and caching
- **Tailwind CSS** with custom design tokens for consistent styling
- **shadcn/ui** components for polished UI elements

### Backend (Supabase)
- **PostgreSQL Database** with Row Level Security (RLS)
- **Authentication** with email/password and social sign-in support
- **Edge Functions** for serverless backend logic
- **Storage Buckets** for document and profile photo uploads
- **Real-time Subscriptions** for live data updates

### Security
- **Row Level Security**: Database-level access control
- **Role-based Permissions**: System admin and NGO admin roles
- **Secure Authentication**: JWT-based auth with refresh tokens
- **Activity Logging**: Comprehensive audit trail for all actions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account (for cloud features)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Setup
The app uses Supabase for backend services.

For local development, create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 User Roles

### Business Owner
- Full access to their business data
- Can invite team members
- Manage all business operations
- Apply for loans and credit

### Team Member
- Access to pages granted by business owner
- Can perform operations within their permissions
- View business data based on access level

### NGO Admin
- Monitor businesses under their NGO
- View activity logs for partner businesses
- Manage loan applications and disbursements
- Cannot modify business data directly

### System Admin
- Full platform access
- Manage all users and businesses
- Create and manage NGO organizations
- Platform-wide monitoring and controls

## 🗂️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── inventory/      # Inventory management components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Other feature components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Page components (routes)
└── main.tsx           # Application entry point

supabase/
├── functions/          # Edge functions
└── migrations/         # Database migrations
```

## 🎨 Design System

MiBuks uses a semantic design token system with:
- Custom color palette with HSL values
- Responsive typography scale
- Consistent spacing and sizing
- Dark mode support
- Beautiful gradients and shadows

All design tokens are defined in `src/index.css` and `tailwind.config.ts`.

## 📊 Database Schema

Key database tables:
- `businesses` - Business profiles and settings
- `profiles` - User profiles
- `sales` - Sales transactions
- `invoices` & `invoice_items` - Invoice management
- `customers` - Customer records
- `inventory` - Product inventory
- `suppliers` - Supplier information
- `expenses` - Business expenses
- `loan_applications` - Loan requests
- `ngos` - NGO organizations
- `ngo_members` - NGO staff members
- `organization_members` - Business team members
- `activity_logs` - Audit trail

## 🔧 Development

### Technologies Used
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Date Handling**: date-fns
- **Routing**: React Router v6
- **State Management**: TanStack Query, React Context

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Component-based architecture
- Custom hooks for reusable logic
- Semantic HTML and accessibility

## 🚀 Deployment

The project can be deployed to any static hosting service:

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Vercel
1. Import your GitHub repository
2. Framework preset: Vite
3. Add environment variables
4. Deploy

### Other Options
- GitHub Pages
- AWS S3 + CloudFront
- DigitalOcean App Platform
- Railway

Build command: `npm run build`
Output directory: `dist`

## 📖 Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

Changes can be made through:
1. **GitHub**: Fork the repository and create pull requests
2. **Local Development**: Clone, edit, and push

## 📝 License

Copyright © 2024 MiBuks. All rights reserved.

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Check the [Supabase Documentation](https://supabase.com/docs)
- Review React and Vite documentation

---

**Built with ❤️**
