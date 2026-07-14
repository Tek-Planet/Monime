# Software Requirements Specification (SRS)
## MSME Business Management & NGO Funding Platform

**Version:** 1.0  
**Date:** November 24, 2025  
**Prepared by:** System Documentation Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [User Roles and Access Control](#3-user-roles-and-access-control)
4. [Functional Requirements - Client Module](#4-functional-requirements---client-module)
5. [Functional Requirements - Admin Module](#5-functional-requirements---admin-module)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Database Schema](#7-database-schema)
8. [Security Requirements](#8-security-requirements)
9. [Integration Requirements](#9-integration-requirements)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a comprehensive description of the MSME (Micro, Small, and Medium Enterprises) Business Management & NGO Funding Platform. The system serves dual purposes: enabling MSMEs to manage their business operations and facilitating NGOs to disburse and track funds to eligible businesses.

### 1.2 Scope
The platform encompasses:
- Complete business management suite for MSMEs
- Multi-level administrative system (System Admin, NGO Admin)
- Fund disbursement and tracking system
- Credit scoring and loan application management
- Team collaboration with granular access control
- Comprehensive analytics and reporting

### 1.3 Definitions and Acronyms
- **MSME**: Micro, Small, and Medium Enterprises
- **NGO**: Non-Governmental Organization
- **RLS**: Row Level Security
- **SRS**: Software Requirements Specification
- **KYC**: Know Your Customer

---

## 2. System Overview

### 2.1 System Architecture
The system is built on a modern web stack:
- **Frontend**: React 18 with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL database, Authentication, Storage, Edge Functions)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6

### 2.2 Key System Components
1. **Client Module**: Business management tools for MSME owners and team members
2. **Admin Module**: Administrative tools for System Admins and NGO Admins
3. **Authentication System**: Multi-role authentication with Supabase Auth
4. **Database Layer**: PostgreSQL with Row Level Security (RLS)
5. **File Storage**: Supabase Storage for documents and photos
6. **Notification System**: Email notifications via Resend API

---

## 3. User Roles and Access Control

### 3.1 User Role Hierarchy

#### 3.1.1 System Administrator
- **Access Level**: Full system access
- **Capabilities**:
  - Manage all users across the platform
  - Create and manage NGOs
  - View and manage all businesses
  - Access system-wide analytics
  - View activity logs across all entities
  - Seed database with sample data
  - Assign businesses to NGOs
  - Create additional system admins

#### 3.1.2 NGO Administrator
- **Access Level**: NGO-specific access
- **Capabilities**:
  - View businesses assigned to their NGO
  - Create and manage fund disbursements
  - Approve/reject disbursement requests
  - Track fund utilization
  - View NGO-specific analytics
  - Access activity logs for their NGO
  - Manage NGO member team

#### 3.1.3 Business Owner
- **Access Level**: Full access to owned business
- **Capabilities**:
  - Complete access to all business modules
  - Invite team members
  - Set granular page access for team members
  - Manage business settings
  - View all business data and reports
  - Upload business documents
  - Apply for loans and credit

#### 3.1.4 Team Member
- **Access Level**: Restricted based on assigned permissions
- **Capabilities**:
  - Access only to pages granted by business owner
  - View/edit data within permitted modules
  - Cannot modify team settings or business configuration

---

## 4. Functional Requirements - Client Module

### 4.1 Authentication & Onboarding

#### 4.1.1 User Registration
**FR-AUTH-001**: The system shall allow new users to register with email and password.
- User provides first name, last name, email, phone number
- Password must meet security requirements (minimum 8 characters)
- Email verification required before account activation
- Automatic creation of user profile in database

#### 4.1.2 User Login
**FR-AUTH-002**: The system shall authenticate users via email/password combination.
- Secure password hashing and validation
- Session management with automatic token refresh
- "Remember me" functionality
- Password reset via email link

#### 4.1.3 Onboarding Process
**FR-AUTH-003**: New users must complete a two-step onboarding process.
- **Step 1 - User Details**: Confirm personal information (first name, last name, email, phone)
- **Step 2 - Business Details**: Create business profile
  - Business name (required)
  - Business type selection from predefined categories
  - Business address
  - Business phone number
  - Business email
  - Currency selection (default: SLL - Sierra Leonean Leone)
  - Tax rate configuration
- User becomes business owner upon completion

#### 4.1.4 Team Member Onboarding
**FR-AUTH-004**: Invited team members shall have streamlined onboarding.
- Accept invitation via email link
- Create account or login
- Complete user details form
- Automatically associated with inviting business
- Access restricted to assigned pages

### 4.2 Dashboard Module

#### 4.2.1 Overview Statistics
**FR-DASH-001**: Dashboard shall display key business metrics.
- **Revenue Card**:
  - Total revenue for current period
  - Percentage change from previous period
  - Visual indicator (up/down arrow)
- **Expenses Card**:
  - Total expenses for current period
  - Percentage change from previous period
- **Profit Card**:
  - Net profit (Revenue - Expenses)
  - Percentage change from previous period
- **Customers Card**:
  - Total customer count
  - New customers this period
- Data filters: Today, This Week, This Month, This Year

#### 4.2.2 Revenue Chart
**FR-DASH-002**: Display visual revenue trends over time.
- Interactive line/bar chart
- Selectable time periods (7 days, 30 days, 90 days, 1 year)
- Hover tooltips showing exact values
- Responsive design for mobile/desktop

#### 4.2.3 Recent Transactions
**FR-DASH-003**: Show latest business transactions.
- Display last 5-10 transactions
- Transaction details: date, description, amount, type (sale/expense)
- Quick links to detailed views
- Real-time updates when new transactions occur

#### 4.2.4 Birthday Reminders
**FR-DASH-004**: Alert users of upcoming customer birthdays.
- Display customers with birthdays in next 7 days
- Customer name, birthday date, contact information
- Quick action buttons (call, email, SMS)
- Dismissible notifications

#### 4.2.5 Welcome Section
**FR-DASH-005**: Personalized welcome message.
- Greet user by name
- Display current date/time
- Quick action buttons for common tasks
- Motivational business tip or quote

### 4.3 Sales Module

#### 4.3.1 Record Sale
**FR-SALES-001**: Users shall be able to record new sales transactions.
- **Required Fields**:
  - Sale date (default: today)
  - Total amount
- **Optional Fields**:
  - Customer selection (from customers database)
  - Payment method (Cash, Mobile Money, Bank Transfer, Credit Card, Check, Other)
  - Invoice reference (link to existing invoice)
  - Notes/description
- Automatic timestamp of creation
- User ID tracking for audit trail

#### 4.3.2 View Sales
**FR-SALES-002**: Display comprehensive sales list.
- Sortable table with columns:
  - Sale date
  - Customer name (if assigned)
  - Amount
  - Payment method
  - Notes
  - Actions (View, Edit, Delete)
- Search and filter capabilities:
  - By customer
  - By date range
  - By payment method
  - By amount range
- Pagination for large datasets
- Export to CSV/PDF

#### 4.3.3 Edit Sale
**FR-SALES-003**: Users shall be able to modify existing sales records.
- Update any field (date, customer, amount, payment method, notes)
- Maintain audit trail with updated_at timestamp
- Validate data integrity before saving
- Prevent editing if linked to locked invoice

#### 4.3.4 Delete Sale
**FR-SALES-004**: Users shall be able to delete sales records.
- Soft delete with confirmation dialog
- Cascade check for related records (invoices, credit transactions)
- Maintain audit trail
- Owner/Admin permission required

#### 4.3.5 Generate Receipt
**FR-SALES-005**: Generate PDF receipt for sales transactions.
- Business header with logo and details
- Sale transaction details
- Customer information
- Payment method
- Itemized breakdown if available
- Download or share via email

#### 4.3.6 Sales Analytics
**FR-SALES-006**: Provide sales performance insights.
- Total sales by period
- Sales trends visualization
- Top customers by revenue
- Payment method distribution
- Average sale value
- Sales growth rate

### 4.4 Expenses Module

#### 4.4.1 Record Expense
**FR-EXP-001**: Users shall be able to record business expenses.
- **Required Fields**:
  - Description
  - Amount
  - Expense date (default: today)
- **Optional Fields**:
  - Category (Office Supplies, Utilities, Rent, Salaries, Marketing, Transportation, Equipment, Other)
  - Supplier (from suppliers database)
  - Payment method
  - Notes
- Automatic user ID and timestamp tracking

#### 4.4.2 View Expenses
**FR-EXP-002**: Display comprehensive expense list.
- Sortable table with columns:
  - Date
  - Description
  - Category
  - Supplier
  - Amount
  - Payment method
  - Actions (View, Edit, Delete)
- Search and filter by:
  - Category
  - Date range
  - Supplier
  - Amount range
- Monthly/yearly summary totals
- Export functionality

#### 4.4.3 Edit Expense
**FR-EXP-003**: Modify existing expense records.
- Update all fields
- Maintain audit trail
- Validate supplier relationship
- Timestamp updates

#### 4.4.4 Delete Expense
**FR-EXP-004**: Remove expense records.
- Confirmation dialog
- Check for linked records
- Soft delete with audit trail

#### 4.4.5 View Expense Details
**FR-EXP-005**: Display detailed expense information in modal.
- Full expense details
- Supplier information (if assigned)
- Payment details
- Attached documents/receipts
- Edit/delete actions

#### 4.4.6 Expense Analytics
**FR-EXP-006**: Provide expense insights.
- Total expenses by period
- Category breakdown (pie/bar chart)
- Expense trends over time
- Top expense categories
- Expense vs. budget comparison
- Month-over-month comparison

### 4.5 Inventory Module

#### 4.5.1 Add Inventory Item
**FR-INV-001**: Users shall be able to add new inventory items.
- **Required Fields**:
  - Product name
  - Unit price
  - Stock quantity
- **Optional Fields**:
  - SKU (Stock Keeping Unit)
  - Barcode
  - Description
  - Category
  - Cost price
  - Supplier
  - Minimum stock level (for alerts)
  - Location/warehouse
  - Active status (default: true)
- Automatic timestamp and user tracking

#### 4.5.2 View Inventory
**FR-INV-002**: Display complete inventory list.
- Sortable table with columns:
  - Name
  - SKU
  - Category
  - Stock quantity
  - Unit price
  - Cost price
  - Margin %
  - Status
  - Actions (View, Edit, Restock, Delete)
- Search and filter by:
  - Name/SKU
  - Category
  - Supplier
  - Stock level (in stock, low stock, out of stock)
  - Active status
- Low stock alerts (items below minimum level)
- Stock value calculation
- Export functionality

#### 4.5.3 Edit Inventory Item
**FR-INV-003**: Modify existing inventory items.
- Update all fields
- Recalculate margins automatically
- Maintain price history
- Timestamp updates

#### 4.5.4 Restock Item
**FR-INV-004**: Add stock to existing items.
- Specify quantity to add
- Optional: purchase price, supplier reference
- Automatic stock quantity update
- Create expense record for purchase (optional)
- Track restock history

#### 4.5.5 Delete Inventory Item
**FR-INV-005**: Remove inventory items.
- Confirmation dialog
- Cannot delete if linked to active invoices/sales
- Soft delete with audit trail
- Mark as inactive instead of hard delete

#### 4.5.6 Inventory Analytics
**FR-INV-006**: Provide inventory insights.
- Total inventory value (cost basis)
- Total retail value
- Potential profit margin
- Stock turnover rate
- Top-selling items
- Slow-moving items
- Stock alerts dashboard
- Category distribution

#### 4.5.7 Barcode Scanning
**FR-INV-007**: Support barcode scanning for quick lookup.
- Camera/scanner integration
- Quick search by barcode
- Fast restock/edit operations

### 4.6 Invoices Module

#### 4.6.1 Create Invoice
**FR-INV-001**: Users shall be able to create professional invoices.
- **Invoice Header**:
  - Auto-generated invoice number (sequential)
  - Invoice date (default: today)
  - Due date
  - Customer selection (required)
  - Business information auto-populated
- **Line Items**:
  - Add multiple products/services
  - Product selection from inventory (with autocomplete)
  - Manual entry option
  - Quantity, unit price, total price per line
  - Remove line items
- **Calculations**:
  - Subtotal (sum of line items)
  - Tax amount (based on business tax rate)
  - Total amount (subtotal + tax)
- **Additional Fields**:
  - Notes/terms
  - Status (Draft, Sent, Paid, Overdue, Cancelled)
- Generate PDF invoice
- Email invoice to customer
- Save and send later

#### 4.6.2 View Invoices
**FR-INV-002**: Display comprehensive invoice list.
- Sortable table with columns:
  - Invoice number
  - Customer name
  - Invoice date
  - Due date
  - Total amount
  - Paid amount
  - Balance due
  - Status
  - Actions (View, Edit, Delete, Mark as Paid, Send)
- Filter by:
  - Status
  - Customer
  - Date range
  - Amount range
- Search by invoice number or customer name
- Status badges with color coding
- Overdue highlighting
- Export functionality

#### 4.6.3 Edit Invoice
**FR-INV-003**: Modify existing invoices.
- Update header information
- Add/remove/modify line items
- Recalculate totals automatically
- Update status
- Cannot edit fully paid invoices
- Maintain version history

#### 4.6.4 Delete Invoice
**FR-INV-004**: Remove invoice records.
- Confirmation dialog
- Cannot delete paid invoices
- Cascade to line items
- Soft delete with audit trail

#### 4.6.5 View Invoice Details
**FR-INV-005**: Display full invoice in modal.
- Complete invoice layout
- Customer information
- Itemized breakdown
- Payment status
- Payment history
- Download PDF button
- Print invoice option
- Email invoice option
- Record payment button

#### 4.6.6 Update Invoice Status
**FR-INV-006**: Change invoice status.
- Status options: Draft, Sent, Paid, Overdue, Cancelled
- Auto-update overdue status based on due date
- Status change triggers:
  - Notification to customer (optional)
  - Update accounting records
  - Trigger workflows (e.g., payment reminders)

#### 4.6.7 Record Payment
**FR-INV-007**: Track partial or full payments against invoices.
- Specify payment amount
- Payment date
- Payment method
- Reference number
- Update paid_amount field
- Auto-update status when fully paid
- Create sales record for payment

#### 4.6.8 Generate Invoice PDF
**FR-INV-008**: Create professional PDF invoices.
- Business logo and branding
- Invoice layout with all details
- Itemized line items table
- Subtotal, tax, and total
- Payment terms and notes
- Footer with contact information
- Download or email delivery

#### 4.6.9 Send Invoice via Email
**FR-INV-009**: Email invoices to customers.
- Recipient email from customer record
- PDF attachment
- Customizable email template
- Subject line with invoice number
- Track sent status
- Resend capability

### 4.7 Customers Module

#### 4.7.1 Add Customer
**FR-CUST-001**: Users shall be able to add new customers.
- **Required Fields**:
  - Customer name
- **Optional Fields**:
  - Email
  - Phone number
  - Address
  - Birthday (for reminders)
  - Business type (B2B or B2C)
  - Credit limit
  - Current balance (defaults to 0)
- Automatic timestamp and user tracking
- Duplicate check by name/email

#### 4.7.2 View Customers
**FR-CUST-002**: Display comprehensive customer list.
- Sortable table with columns:
  - Name
  - Email
  - Phone
  - Business type
  - Current balance
  - Credit limit
  - Birthday
  - Actions (View, Edit, Delete)
- Search by name, email, or phone
- Filter by:
  - Business type
  - Credit status (within limit, over limit)
  - Birthday month
- Customer count statistics
- Export functionality

#### 4.7.3 Edit Customer
**FR-CUST-003**: Modify existing customer records.
- Update all fields
- Adjust credit limit
- Update balance (via credit transactions)
- Maintain contact history
- Timestamp updates

#### 4.7.4 Delete Customer
**FR-CUST-004**: Remove customer records.
- Confirmation dialog
- Cannot delete if:
  - Customer has outstanding balance
  - Customer linked to active invoices/sales
- Soft delete option
- Archive instead of hard delete

#### 4.7.5 Customer Credit Management
**FR-CUST-005**: Manage customer credit balances.
- View current balance
- View credit limit
- Credit utilization percentage
- Apply credit (increase balance)
- Record payment (decrease balance)
- Credit transaction history
- Automatic balance calculations

#### 4.7.6 Credit Transaction History
**FR-CUST-006**: Track all credit-related transactions for customers.
- Transaction types: Purchase on credit, Payment received, Credit adjustment
- Display:
  - Transaction date
  - Type
  - Amount
  - Description
  - Reference number
  - Running balance
- Filter by date range
- Export to PDF/CSV

#### 4.7.7 Birthday Reminders
**FR-CUST-007**: Alert users of customer birthdays.
- Dashboard widget showing upcoming birthdays (7 days)
- Birthday list view in customers module
- Email/SMS reminder capability
- Birthday badge on customer profile
- Quick contact actions

#### 4.7.8 Customer Analytics
**FR-CUST-008**: Provide customer insights.
- Total customers count
- New customers this period
- Top customers by revenue
- Customer lifetime value
- Average purchase value
- Customer acquisition trends
- Credit utilization summary

### 4.8 Suppliers Module

#### 4.8.1 Add Supplier
**FR-SUPP-001**: Users shall be able to add new suppliers.
- **Required Fields**:
  - Supplier name
- **Optional Fields**:
  - Phone number
  - Location/address
  - Product category (what they supply)
  - Current balance (amount owed to supplier)
  - Notes
- Automatic timestamp and user tracking

#### 4.8.2 View Suppliers
**FR-SUPP-002**: Display comprehensive supplier list.
- Sortable table with columns:
  - Name
  - Phone
  - Location
  - Product category
  - Current balance
  - Actions (View, Edit, Delete)
- Search by name or phone
- Filter by:
  - Product category
  - Balance status (amounts owed)
- Total payables summary
- Export functionality

#### 4.8.3 Edit Supplier
**FR-SUPP-003**: Modify existing supplier records.
- Update all fields
- Adjust current balance
- Update contact information
- Timestamp updates

#### 4.8.4 Delete Supplier
**FR-SUPP-004**: Remove supplier records.
- Confirmation dialog
- Cannot delete if:
  - Supplier has outstanding balance
  - Supplier linked to inventory items or expenses
- Soft delete with audit trail

#### 4.8.5 View Supplier Details
**FR-SUPP-005**: Display detailed supplier information.
- Full supplier profile
- Contact information
- Product categories
- Current balance
- Payment history
- Linked inventory items
- Linked expenses
- Total amount paid to date

#### 4.8.6 Supplier Payment Tracking
**FR-SUPP-006**: Track payments made to suppliers.
- Record payment transactions
- Payment date
- Amount
- Payment method
- Reference number
- Update current balance automatically
- Payment history log

#### 4.8.7 Supplier Analytics
**FR-SUPP-007**: Provide supplier insights.
- Total suppliers count
- Total payables
- Top suppliers by purchase volume
- Payment trends
- Average payment terms
- Supplier performance metrics

### 4.9 Credit & Loan Module

#### 4.9.1 Credit Score Dashboard
**FR-CREDIT-001**: Display business credit score and factors.
- Overall credit score (0-100 scale)
- Score breakdown by factor:
  - Payment history
  - Credit utilization
  - Business age
  - Revenue consistency
  - Debt-to-income ratio
- Visual score gauge
- Score trend over time
- Tips for improving score

#### 4.9.2 Loan Products Display
**FR-CREDIT-002**: Show available loan products.
- List of active loan products
- For each product:
  - Product name
  - Interest rate
  - Loan amount range (min-max)
  - Term length (months)
  - Minimum credit score required
  - Product type (Working Capital, Equipment, Inventory Restocking, etc.)
  - Description
- Eligibility indicators based on user's credit score
- Apply button for eligible products

#### 4.9.3 Loan Application Submission
**FR-CREDIT-003**: Users shall be able to apply for loans.
- **Application Form**:
  - Select loan product
  - Requested amount (within product limits)
  - Loan purpose description
  - Upload supporting documents (optional):
    - Business registration
    - Financial statements
    - Tax returns
    - Bank statements
  - For inventory restocking loans:
    - Select supplier
    - Specify items to restock (from inventory)
    - Quantity and unit prices
- Credit score check
- Automatic application number generation
- Submit for review

#### 4.9.4 View Loan Applications
**FR-CREDIT-004**: Display user's loan application history.
- Table with columns:
  - Application number
  - Loan product
  - Requested amount
  - Approved amount
  - Status (Pending, Under Review, Approved, Rejected, Disbursed)
  - Application date
  - Actions (View Details)
- Filter by status
- Status-based color coding
- Notifications for status changes

#### 4.9.5 Loan Application Details
**FR-CREDIT-005**: View detailed loan application information.
- All application data
- Credit score at time of application
- Risk assessment results
- Approval/rejection reason
- Approved amount and terms
- Disbursement details (if approved)
- Repayment schedule
- Supporting documents
- Application timeline/history

#### 4.9.6 Loan Repayment Tracking
**FR-CREDIT-006**: Track loan repayment obligations.
- List of active loans
- For each loan:
  - Loan amount
  - Outstanding balance
  - Interest rate
  - Monthly payment amount
  - Next payment due date
  - Payment history
- Make payment action
- View repayment schedule
- Total debt summary
- Overdue alerts

#### 4.9.7 Make Loan Payment
**FR-CREDIT-007**: Record loan repayment transactions.
- Specify payment amount
- Payment date
- Payment method
- Reference number
- Split between principal and interest
- Update outstanding balance
- Update next due date
- Generate payment receipt

#### 4.9.8 Credit Analytics
**FR-CREDIT-008**: Provide credit-related insights.
- Total active loans
- Total outstanding debt
- Monthly payment obligations
- Debt service ratio
- Payment history (on-time %)
- Credit utilization trends
- Loan approval rate

### 4.10 Reports Module

#### 4.10.1 Financial Summary Report
**FR-REP-001**: Generate comprehensive financial overview.
- **Report Period Selection**: Today, This Week, This Month, This Year, Custom Range
- **Metrics**:
  - Total revenue
  - Total expenses
  - Net profit/loss
  - Profit margin %
  - Revenue growth rate
  - Expense ratio
- **Charts**:
  - Revenue vs. Expenses comparison
  - Monthly profit trend
  - Revenue by source
- Export to PDF
- Print functionality

#### 4.10.2 Sales Report
**FR-REP-002**: Detailed sales performance report.
- Sales by period (daily, weekly, monthly, yearly)
- Sales by customer
- Sales by payment method
- Sales by product/category
- Average sale value
- Sales conversion metrics
- Top performing products
- Seasonal trends
- Export to Excel/CSV

#### 4.10.3 Expense Report
**FR-REP-003**: Comprehensive expense analysis.
- Expenses by period
- Expenses by category
- Expenses by supplier
- Largest expenses
- Expense trends
- Budget vs. actual comparison
- Cost reduction opportunities
- Export functionality

#### 4.10.4 Inventory Report
**FR-REP-004**: Inventory status and valuation report.
- Current stock levels
- Inventory valuation (cost and retail)
- Low stock items
- Out of stock items
- Slow-moving items
- Fast-moving items
- Stock turnover ratio
- Reorder recommendations
- Dead stock identification
- Export functionality

#### 4.10.5 Customer Report
**FR-REP-005**: Customer analysis report.
- Customer list with purchase history
- Top customers by revenue
- New customers this period
- Customer retention rate
- Customer lifetime value
- Credit status summary
- Outstanding balances
- Customer acquisition cost
- Export functionality

#### 4.10.6 Tax Report
**FR-REP-006**: Tax-related reporting.
- Taxable sales summary
- Tax collected by period
- Tax liability calculation
- Sales tax breakdown by rate
- Tax payment history
- Export for tax filing

#### 4.10.7 Profit & Loss Statement
**FR-REP-007**: Standard P&L statement.
- Revenue section (all income sources)
- Cost of goods sold
- Gross profit
- Operating expenses (categorized)
- Operating profit
- Other income/expenses
- Net profit before tax
- Period comparison
- Export to PDF/Excel

#### 4.10.8 Custom Report Builder
**FR-REP-008**: Create custom reports.
- Select data sources (sales, expenses, inventory, etc.)
- Choose metrics and dimensions
- Apply filters and date ranges
- Select visualization type
- Save report templates
- Schedule automated reports
- Share reports with team members

### 4.11 Settings Module

#### 4.11.1 Business Profile Settings
**FR-SET-001**: Manage business information.
- Edit business name
- Update business type
- Change address
- Update phone and email
- Modify tax rate
- Change currency
- Upload/change business logo
- Business registration details
- Save changes with validation

#### 4.11.2 User Profile Settings
**FR-SET-002**: Manage personal user information.
- Edit first name and last name
- Update email (with verification)
- Change phone number
- Upload profile photo
- Update password (current password required)
- Enable/disable notifications
- Set language preference
- Save changes

#### 4.11.3 Team Management
**FR-SET-003**: Manage organization members.
- **View Team Members**:
  - Display all team members
  - Show name, email, role, join date, status
  - Active/inactive indicators
- **Invite New Member**:
  - Enter email address
  - Set accessible pages/permissions:
    - Dashboard
    - Sales
    - Expenses
    - Inventory
    - Invoices
    - Customers
    - Suppliers
    - Reports
    - Credit
  - Send invitation email with unique link
  - Track invitation status (pending, accepted, expired)
- **Edit Member Access**:
  - Modify accessible pages
  - Cannot reduce owner permissions
- **Remove Team Member**:
  - Deactivate member access
  - Confirmation required
  - Maintain audit trail

#### 4.11.4 Notification Preferences
**FR-SET-004**: Configure notification settings.
- Email notifications:
  - Sales notifications
  - Expense alerts
  - Low stock alerts
  - Invoice due reminders
  - Payment received notifications
  - Birthday reminders
  - Loan payment reminders
- SMS notifications (if enabled)
- In-app notifications
- Notification frequency settings

#### 4.11.5 Document Management
**FR-SET-005**: Upload and manage business documents.
- **Document Types**:
  - Business registration certificate
  - Tax registration
  - Business license
  - Financial statements
  - Contracts
  - Other documents
- Upload functionality (PDF, images, Word, Excel)
- View uploaded documents
- Download documents
- Delete documents
- Document metadata (upload date, size, uploader)

#### 4.11.6 Data Export & Backup
**FR-SET-006**: Export business data.
- Export all data to CSV/Excel
- Select specific modules to export
- Scheduled backups
- Download backup files
- Restore from backup (admin only)

#### 4.11.7 Security Settings
**FR-SET-007**: Manage account security.
- Change password
- Enable two-factor authentication (2FA)
- View active sessions
- Logout from all devices
- View login history
- Security alerts

### 4.12 Multi-Language Support

#### 4.12.1 Language Selection
**FR-LANG-001**: Support multiple languages.
- Language selector in header
- Supported languages:
  - English (default)
  - Krio (Sierra Leone)
  - Additional languages as needed
- Persist language preference per user
- RTL support for applicable languages

#### 4.12.2 Translation Coverage
**FR-LANG-002**: All UI elements shall be translatable.
- All static text
- Form labels and placeholders
- Error messages
- Success messages
- Notifications
- Report headers
- Email templates

---

## 5. Functional Requirements - Admin Module

### 5.1 System Administrator Functions

#### 5.1.1 User Management

**FR-ADMIN-001**: System admins shall manage all platform users.

##### View All Users
- Display all registered users across the platform
- Sortable table with columns:
  - Name (first + last)
  - Email
  - Phone
  - Role (Business Owner, Team Member, NGO Admin, System Admin)
  - Registration date
  - Last login
  - Status (Active, Inactive, Suspended)
  - Associated business (if applicable)
  - Actions (View, Edit, Suspend, Delete)
- Search by name, email, or phone
- Filter by:
  - Role
  - Status
  - Registration date range
  - Has business or not
- Pagination for large datasets
- Export user list

##### View User Details
- Complete user profile information
- Associated businesses (owned or member of)
- Activity log
- Login history
- Documents uploaded
- Credit applications
- Sales/expense statistics (if business owner)

##### Create New User
- Manual user creation by admin
- Assign role: System Admin, NGO Admin, Business User
- Send welcome email with temporary password
- Option to require password change on first login

##### Edit User
- Update user information
- Change role/permissions
- Reset password
- Verify/unverify email
- Update phone number

##### Suspend/Activate User
- Temporarily disable user access
- Reason for suspension (required)
- Notification to user
- Audit trail
- Reactivate suspended users

##### Delete User
- Permanent account deletion
- Confirmation with reason
- Cannot delete if:
  - User is business owner with active business
  - User has pending loan applications
- Cascade options for associated data
- Audit trail

#### 5.1.2 NGO Management

**FR-ADMIN-002**: System admins shall manage NGO entities.

##### View All NGOs
- Display all registered NGOs
- Table with columns:
  - NGO name
  - Contact email
  - Contact phone
  - Address
  - Number of businesses assigned
  - Total funds disbursed
  - Status (Active, Inactive)
  - Created date
  - Actions (View, Edit, Deactivate, Delete)
- Search by name
- Filter by status
- Export NGO list

##### Create New NGO
- NGO registration form:
  - NGO name (required)
  - Description
  - Contact email
  - Contact phone
  - Address
  - Initial status (Active/Inactive)
- Automatic timestamp
- Generate unique NGO ID

##### Edit NGO
- Update NGO information
- Change contact details
- Modify description
- Update address
- Maintain audit trail

##### View NGO Details
- Complete NGO profile
- List of assigned businesses
- Fund disbursement history
- Total funds allocated
- NGO admin members
- Performance metrics
- Activity logs

##### Assign Business to NGO
- Select business from dropdown
- Select NGO to assign
- Record assignment date
- Notify business owner
- Update NGO business count
- Cannot reassign if business has active disbursements

##### Remove Business from NGO
- Select business to remove
- Confirmation required
- Check for active disbursements
- Update records
- Notify relevant parties

##### Deactivate/Activate NGO
- Change NGO status
- Reason for deactivation
- Impact on assigned businesses
- Notification to NGO admins
- Cannot deactivate if active disbursements exist

##### Delete NGO
- Permanent NGO deletion
- Strict conditions:
  - No assigned businesses
  - No disbursement history
  - No active NGO admins
- Confirmation with reason
- Audit trail

#### 5.1.3 NGO Admin Management

**FR-ADMIN-003**: System admins shall manage NGO administrator accounts.

##### Add NGO Admin
- Search for existing user by email
- OR create new user account
- Assign to specific NGO
- Grant NGO admin role
- Set permissions
- Send notification email

##### View NGO Admins
- List all NGO admins
- Display:
  - Name
  - Email
  - Associated NGO
  - Join date
  - Status
  - Last login
  - Actions
- Filter by NGO
- Search by name/email

##### Edit NGO Admin
- Change assigned NGO
- Update permissions
- Modify user details
- Activate/deactivate

##### Remove NGO Admin
- Revoke NGO admin role
- Reassign to regular user role
- Confirmation required
- Maintain audit trail

#### 5.1.4 Business Management

**FR-ADMIN-004**: System admins shall view and manage all businesses.

##### View All Businesses
- Comprehensive business list
- Table columns:
  - Business name
  - Owner name
  - Business type
  - Registration date
  - Assigned NGO
  - Total revenue
  - Total expenses
  - Status
  - Actions (View Details, Edit, Assign to NGO, Suspend)
- Search by business name or owner
- Filter by:
  - Business type
  - NGO assignment
  - Status
  - Registration date
- Total businesses count
- Export functionality

##### View Business Details
- Complete business profile
- Owner information
- Team members list
- Financial summary:
  - Total revenue
  - Total expenses
  - Profit/loss
  - Inventory value
- Recent transactions
- Loan applications
- Fund disbursements received
- Documents uploaded
- Activity logs

##### Edit Business Information
- Update business details
- Change owner (with confirmation)
- Modify business type
- Update contact information
- Adjust settings

##### Suspend/Activate Business
- Temporarily disable business access
- Reason for suspension
- Impact on team members
- Notification to owner
- Reactivate suspended businesses

##### Delete Business
- Permanent business deletion
- Strict conditions and confirmations
- Data archival options
- Cascade to related records
- Audit trail

##### Assign Business to NGO
- Already covered in NGO Management section
- Dropdown selection of NGO
- Effective date
- Notifications

#### 5.1.5 System-Wide Analytics

**FR-ADMIN-005**: System admins shall access comprehensive platform analytics.

##### Dashboard Statistics
- Total users
- Total businesses
- Total NGOs
- Total sales (platform-wide)
- Total expenses (platform-wide)
- Net platform revenue
- Active users today
- New registrations this period
- Total funds disbursed via NGOs

##### User Analytics
- User growth trends
- User acquisition sources
- User engagement metrics
- Active users (daily, weekly, monthly)
- User retention rate
- Churned users

##### Business Analytics
- Business growth trends
- Businesses by type
- Businesses by NGO
- Average business revenue
- Top performing businesses
- Struggling businesses (low activity)
- Business survival rate

##### Financial Analytics
- Platform-wide revenue trends
- Platform-wide expense trends
- Total transaction volume
- Average transaction size
- Revenue by business type
- Payment method distribution

##### NGO Analytics
- Fund disbursement trends
- Total funds allocated by NGO
- Average disbursement size
- Disbursement by type (grant/loan/credit)
- Repayment rates
- NGO performance comparison

##### Geographic Analytics
- Users by location
- Businesses by region
- Revenue by region
- Growth hotspots

##### Export Analytics
- Download reports in PDF/Excel
- Schedule automated reports
- Custom date ranges
- Visualization options

#### 5.1.6 Activity Logs

**FR-ADMIN-006**: System admins shall view all platform activity logs.

##### View Activity Logs
- Comprehensive log table:
  - Timestamp
  - User (name and ID)
  - Action performed
  - Entity type (user, business, NGO, sale, expense, etc.)
  - Entity ID
  - Business context (if applicable)
  - IP address
  - User agent
  - Metadata (additional details)
- Real-time updates
- Search by user, action, or entity
- Filter by:
  - Date range
  - User
  - Business
  - NGO
  - Action type
  - Entity type
- Pagination
- Export logs

##### Action Types Logged
- User actions: Login, Logout, Registration, Profile Update
- Business actions: Create, Update, Delete, Settings Change
- Transaction actions: Sale Created, Expense Recorded, Invoice Generated
- Inventory actions: Item Added, Stock Updated, Item Deleted
- Customer actions: Customer Added, Customer Updated, Credit Applied
- Admin actions: User Created, NGO Created, Business Assigned, Settings Changed
- Security actions: Failed Login, Password Reset, 2FA Enabled

##### Log Retention
- Configure log retention period
- Archive old logs
- Purge logs after retention period

#### 5.1.7 Database Seeding (Development/Demo)

**FR-ADMIN-007**: System admins shall seed database with sample data.

##### Seed Database Function
- Generate sample data for:
  - Users (business owners and team members)
  - Businesses (various types and sizes)
  - NGOs
  - Customers
  - Suppliers
  - Products/Inventory
  - Sales transactions
  - Expenses
  - Invoices
  - Loan products
  - Loan applications
- Specify number of records to create per entity
- Realistic fake data (names, addresses, amounts)
- Maintain referential integrity
- Confirmation required
- Only available in development/staging environments
- Cannot seed production database

##### Reset Database
- Clear all seeded data
- Confirmation with safety checks
- Maintain system admin accounts
- Audit trail

### 5.2 NGO Administrator Functions

#### 5.2.1 NGO Dashboard

**FR-NGO-001**: NGO admins shall have a dedicated dashboard.

##### Overview Statistics
- Total businesses assigned to NGO
- Total funds disbursed
- Total funds pending approval
- Total funds disbursed this period
- Number of active disbursements
- Number of repayments due
- Recent activity

##### Quick Actions
- Create new disbursement
- View pending approvals
- View businesses
- View repayment schedule
- Access reports

#### 5.2.2 View NGO Businesses

**FR-NGO-002**: NGO admins shall view businesses assigned to their NGO.

##### Business List
- Table of NGO-assigned businesses:
  - Business name
  - Owner name
  - Business type
  - Registration date
  - Total funds received
  - Outstanding balance (if loans)
  - Last disbursement date
  - Status
  - Actions (View Details)
- Search by business name
- Filter by:
  - Business type
  - Fund status (received funds, pending, none)
  - Outstanding balance
- Export list

##### Business Details
- Complete business profile
- Owner contact information
- Financial summary
- Fund disbursement history
- Repayment history (if applicable)
- Business performance metrics
- Recent transactions
- Documents submitted

#### 5.2.3 Fund Disbursement Management

**FR-NGO-003**: NGO admins shall create and manage fund disbursements.

##### Create New Disbursement
- **Disbursement Form**:
  - Select business (from NGO-assigned businesses)
  - Disbursement amount
  - Disbursement type:
    - Grant (no repayment)
    - Loan (with interest and repayment schedule)
    - Credit (interest-free, repayment required)
  - Purpose/description (required)
  - Disbursement date (default: today)
  - **If Loan or Credit**:
    - Interest rate (% per annum, for loans)
    - Repayment start date
    - Repayment end date
    - Repayment frequency (Weekly, Bi-weekly, Monthly, Quarterly)
  - Notes/terms
- Validation:
  - Amount must be positive
  - Business must be assigned to NGO
  - Dates must be logical
- Auto-generate disbursement record
- Initial status: Pending

##### View Disbursements
- Table of all disbursements for NGO:
  - Disbursement date
  - Business name
  - Amount
  - Type (Grant/Loan/Credit)
  - Purpose
  - Status (Pending, Approved, Disbursed, Completed, Rejected)
  - Repayment status (if applicable)
  - Actions (View, Approve, Disburse, Cancel)
- Filter by:
  - Status
  - Type
  - Business
  - Date range
- Search by business name
- Total disbursed amount
- Pending approvals count
- Export functionality

##### Approve Disbursement
- Review disbursement details
- Approve or reject
- Reason for rejection (if applicable)
- Notification to business owner
- Update status to "Approved"
- Record approver and approval timestamp

##### Disburse Funds
- Mark approved disbursement as "Disbursed"
- Record disbursement date (actual date funds transferred)
- Disbursement method (Bank Transfer, Cash, Mobile Money, etc.)
- Reference number (transaction ID)
- Notification to business owner
- If loan/credit, auto-generate repayment schedule

##### View Disbursement Details
- Full disbursement information
- Business details
- Amount and type
- Purpose
- Approval details (approver, date, notes)
- Disbursement details (date, method, reference)
- Repayment schedule (if applicable)
- Repayment history (if applicable)
- Associated documents

##### Cancel Disbursement
- Cancel pending or approved disbursements
- Cannot cancel disbursed funds
- Reason required
- Confirmation dialog
- Notification to business owner
- Audit trail

#### 5.2.4 Repayment Tracking

**FR-NGO-004**: NGO admins shall track loan/credit repayments.

##### Repayment Schedule
- View repayment schedules for all active loans/credits
- For each repayment:
  - Business name
  - Due date
  - Amount due
  - Principal portion
  - Interest portion (if loan)
  - Status (Upcoming, Due, Overdue, Paid)
  - Actions (View, Record Payment)
- Filter by:
  - Status
  - Business
  - Due date range
- Overdue alerts
- Export schedule

##### Record Repayment
- Select disbursement/repayment entry
- Record payment details:
  - Payment amount
  - Payment date
  - Payment method
  - Reference number
  - Notes
- Partial payment support
- Update repayment status
- Update outstanding balance
- Notification to business owner
- Generate payment receipt

##### View Repayment History
- List all repayments made for a disbursement
- Payment details
- Running outstanding balance
- Payment compliance rate
- Late payment count
- Total repaid vs. total due

##### Overdue Management
- Alert for overdue repayments
- Contact business owner (email/SMS/call)
- Reschedule repayments
- Penalty/interest on late payments (if configured)
- Escalation procedures

#### 5.2.5 NGO Analytics & Reports

**FR-NGO-005**: NGO admins shall access NGO-specific analytics.

##### Disbursement Analytics
- Total funds disbursed (all time, by period)
- Disbursements by type (grant/loan/credit)
- Disbursements by business
- Average disbursement amount
- Disbursement growth trends
- Approval rate
- Rejection reasons

##### Repayment Analytics
- Total repayments received
- Outstanding balance
- Repayment rate (% of on-time payments)
- Default rate
- Average repayment period
- Recovery rate

##### Business Performance
- Businesses funded vs. total assigned
- Business growth after funding
- Revenue improvement metrics
- Job creation impact
- Success stories

##### Impact Reports
- Number of businesses supported
- Total funds deployed
- Lives impacted
- Economic impact metrics
- Repayment performance
- Sustainability indicators

##### Export Reports
- PDF/Excel export
- Custom date ranges
- Share with stakeholders
- Scheduled reports

#### 5.2.6 NGO Activity Logs

**FR-NGO-006**: NGO admins shall view NGO-specific activity logs.
- Filter activity logs by NGO
- View actions related to:
  - Disbursements
  - Repayments
  - Business assignments
  - NGO admin actions
- Same features as system admin activity logs but scoped to NGO

---

## 6. Non-Functional Requirements

### 6.1 Performance Requirements

**NFR-PERF-001**: Response Time
- Page load time: < 2 seconds on average network
- API response time: < 500ms for standard queries
- Database queries: < 200ms for indexed queries
- Search results: < 1 second
- Report generation: < 5 seconds for standard reports

**NFR-PERF-002**: Scalability
- Support minimum 10,000 concurrent users
- Database: Handle 1 million+ records per table
- File storage: Support unlimited document uploads (within storage plan)
- Auto-scaling infrastructure for traffic spikes

**NFR-PERF-003**: Throughput
- Handle minimum 100 transactions per second
- Process batch operations efficiently
- Support bulk data imports/exports

### 6.2 Security Requirements

**NFR-SEC-001**: Authentication & Authorization
- Secure password hashing (bcrypt or stronger)
- Multi-factor authentication (2FA) support
- JWT-based session management
- Role-based access control (RBAC)
- Row-level security (RLS) in database
- Session timeout after inactivity (30 minutes default)

**NFR-SEC-002**: Data Protection
- Encryption at rest for sensitive data
- Encryption in transit (TLS 1.3)
- Secure API endpoints (HTTPS only)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

**NFR-SEC-003**: Privacy & Compliance
- GDPR compliance for data handling
- User consent for data processing
- Right to data deletion
- Data portability
- Privacy policy and terms of service
- Audit logging for sensitive operations

**NFR-SEC-004**: Backup & Recovery
- Daily automated backups
- Point-in-time recovery capability
- Backup encryption
- Disaster recovery plan
- Maximum 1 hour data loss tolerance (RPO)
- Maximum 4 hour recovery time (RTO)

### 6.3 Usability Requirements

**NFR-USE-001**: User Interface
- Responsive design (mobile, tablet, desktop)
- Intuitive navigation
- Consistent design language (shadcn/ui)
- Accessibility compliance (WCAG 2.1 Level AA)
- Dark/light mode support
- Mobile-first approach

**NFR-USE-002**: Learnability
- Onboarding tutorial for new users
- Contextual help and tooltips
- Documentation and user guides
- Video tutorials
- FAQ section
- In-app chat support

**NFR-USE-003**: Error Handling
- Clear, user-friendly error messages
- Actionable error guidance
- Graceful degradation
- Form validation with inline feedback
- Toast notifications for actions
- Error logging for debugging

### 6.4 Reliability Requirements

**NFR-REL-001**: Availability
- 99.9% uptime SLA
- Planned maintenance windows (off-peak hours)
- Load balancing for high availability
- Redundant infrastructure

**NFR-REL-002**: Data Integrity
- ACID compliance for transactions
- Foreign key constraints
- Data validation at application and database levels
- Prevent duplicate records
- Referential integrity enforcement

**NFR-REL-003**: Fault Tolerance
- Graceful handling of third-party service failures
- Retry mechanisms for transient failures
- Circuit breaker patterns for external APIs
- Fallback mechanisms

### 6.5 Maintainability Requirements

**NFR-MAIN-001**: Code Quality
- TypeScript for type safety
- Modular, component-based architecture
- Consistent coding standards (ESLint, Prettier)
- Comprehensive code comments
- Version control (Git)

**NFR-MAIN-002**: Testing
- Unit tests for critical functions
- Integration tests for API endpoints
- End-to-end tests for key workflows
- Minimum 80% code coverage
- Automated testing in CI/CD pipeline

**NFR-MAIN-003**: Monitoring & Logging
- Application performance monitoring (APM)
- Error tracking and alerting
- User analytics
- Audit logs for compliance
- Real-time system health dashboard

### 6.6 Compatibility Requirements

**NFR-COMP-001**: Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

**NFR-COMP-002**: Device Support
- Desktop (Windows, macOS, Linux)
- Tablets (iPad, Android tablets)
- Smartphones (iOS, Android)
- Minimum screen resolution: 320px width

**NFR-COMP-003**: Integration Compatibility
- RESTful API standards
- JSON data format
- OAuth 2.0 for third-party integrations
- Webhook support for event notifications

---

## 7. Database Schema

### 7.1 Core Tables

#### 7.1.1 Users & Authentication
- **auth.users** (Supabase Auth table)
  - id (UUID, PK)
  - email
  - encrypted_password
  - email_confirmed_at
  - created_at
  - updated_at

- **profiles**
  - id (UUID, PK)
  - user_id (UUID, FK to auth.users)
  - first_name
  - last_name
  - phone
  - email
  - created_at
  - updated_at

- **user_roles**
  - id (UUID, PK)
  - user_id (UUID, FK to auth.users)
  - role (ENUM: 'admin', 'user', 'system_admin', 'ngo_admin')
  - created_at
  - updated_at

#### 7.1.2 Business Management
- **businesses**
  - id (UUID, PK)
  - owner_id (UUID, FK to auth.users)
  - ngo_id (UUID, FK to ngos, nullable)
  - business_name
  - business_type
  - email
  - phone
  - address
  - currency
  - tax_rate
  - created_at
  - updated_at

- **organization_members**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - email
  - display_name
  - role (default: 'member')
  - accessible_pages (TEXT[])
  - invited_by (UUID, FK to auth.users)
  - invited_at
  - joined_at
  - is_active (BOOLEAN)
  - created_at
  - updated_at

- **organization_invitations**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - email
  - invited_by (UUID, FK to auth.users)
  - invitation_token (UUID, unique)
  - accessible_pages (TEXT[])
  - status (ENUM: 'pending', 'accepted', 'expired')
  - expires_at
  - created_at

#### 7.1.3 NGO Management
- **ngos**
  - id (UUID, PK)
  - name
  - description
  - contact_email
  - contact_phone
  - address
  - is_active (BOOLEAN)
  - created_at
  - updated_at

- **ngo_members**
  - id (UUID, PK)
  - ngo_id (UUID, FK to ngos)
  - user_id (UUID, FK to auth.users)
  - role (ENUM: 'admin', 'member')
  - is_active (BOOLEAN)
  - created_at
  - updated_at

#### 7.1.4 Financial Transactions
- **sales**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - customer_id (UUID, FK to customers, nullable)
  - invoice_id (UUID, FK to invoices, nullable)
  - total_amount
  - payment_method
  - sale_date
  - notes
  - created_at

- **expenses**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - supplier_id (UUID, FK to suppliers, nullable)
  - description
  - amount
  - category
  - payment_method
  - expense_date
  - notes
  - created_at
  - updated_at

#### 7.1.5 Inventory Management
- **inventory**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - name
  - sku
  - barcode
  - description
  - category
  - stock_quantity
  - unit_price
  - cost_price
  - min_stock_level
  - supplier
  - location
  - is_active (BOOLEAN)
  - created_at
  - updated_at

- **products** (for invoice line items)
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - name
  - sku
  - barcode
  - description
  - category
  - unit_price
  - cost_price
  - stock_quantity
  - min_stock_level
  - is_active (BOOLEAN)
  - created_at
  - updated_at

#### 7.1.6 Invoicing
- **invoices**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - customer_id (UUID, FK to customers, nullable)
  - invoice_number (unique per business)
  - invoice_date
  - due_date
  - subtotal
  - tax_amount
  - total_amount
  - paid_amount
  - status (ENUM: 'draft', 'sent', 'paid', 'overdue', 'cancelled')
  - notes
  - created_at
  - updated_at

- **invoice_items**
  - id (UUID, PK)
  - invoice_id (UUID, FK to invoices)
  - product_id (UUID, FK to products, nullable)
  - product_name
  - quantity
  - unit_price
  - total_price
  - created_at

#### 7.1.7 Customer & Supplier Management
- **customers**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - name
  - email
  - phone
  - address
  - birthday
  - business_type
  - credit_limit
  - current_balance
  - created_at
  - updated_at

- **suppliers**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - name
  - phone
  - location
  - product_category
  - current_balance
  - notes
  - created_at
  - updated_at

- **supplier_payments**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - supplier_id (UUID, FK to suppliers)
  - amount
  - payment_date
  - payment_method
  - reference_number
  - notes
  - created_at
  - updated_at

#### 7.1.8 Credit & Loans
- **credit_transactions**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - customer_id (UUID, FK to customers)
  - transaction_type (ENUM: 'credit_sale', 'payment', 'adjustment')
  - amount
  - transaction_date
  - description
  - reference_number
  - created_at

- **loan_products**
  - id (UUID, PK)
  - name
  - description
  - product_type
  - min_amount
  - max_amount
  - interest_rate
  - term_months
  - min_credit_score
  - is_active (BOOLEAN)
  - created_at
  - updated_at

- **loan_applications**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - loan_product_id (UUID, FK to loan_products)
  - supplier_id (UUID, FK to suppliers, nullable)
  - application_number (unique)
  - requested_amount
  - approved_amount
  - interest_rate
  - term_months
  - credit_score
  - status (ENUM: 'pending', 'under_review', 'approved', 'rejected', 'disbursed')
  - application_data (JSONB)
  - items_to_restock (JSONB, nullable)
  - risk_assessment (JSONB)
  - approval_date
  - disbursement_date
  - repayment_start_date
  - created_at
  - updated_at

- **loan_disbursements**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - loan_application_id (UUID, FK to loan_applications)
  - supplier_id (UUID, FK to suppliers, nullable)
  - amount
  - disbursement_date
  - disbursement_method
  - reference_number
  - status
  - created_at
  - updated_at

- **loan_repayments**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - loan_application_id (UUID, FK to loan_applications)
  - amount
  - principal_amount
  - interest_amount
  - due_date
  - payment_date
  - payment_method
  - reference_number
  - status (ENUM: 'pending', 'paid', 'overdue', 'partially_paid')
  - created_at
  - updated_at

#### 7.1.9 Fund Disbursements (NGO)
- **fund_disbursements**
  - id (UUID, PK)
  - ngo_id (UUID, FK to ngos)
  - business_id (UUID, FK to businesses)
  - created_by (UUID, FK to auth.users)
  - approved_by (UUID, FK to auth.users, nullable)
  - disbursed_by (UUID, FK to auth.users, nullable)
  - amount
  - disbursement_type (ENUM: 'grant', 'loan', 'credit')
  - purpose
  - disbursement_date
  - interest_rate (for loans)
  - repayment_start_date (for loans/credits)
  - repayment_end_date (for loans/credits)
  - repayment_frequency (ENUM: 'weekly', 'bi_weekly', 'monthly', 'quarterly')
  - status (ENUM: 'pending', 'approved', 'disbursed', 'completed', 'rejected')
  - notes
  - approved_at
  - disbursed_at
  - created_at
  - updated_at

- **fund_repayments**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - disbursement_id (UUID, FK to fund_disbursements)
  - due_date
  - amount_due
  - amount_paid
  - payment_date
  - payment_method
  - reference_number
  - status (ENUM: 'pending', 'paid', 'overdue', 'partially_paid')
  - notes
  - created_at
  - updated_at

#### 7.1.10 Documents & Media
- **business_documents**
  - id (UUID, PK)
  - business_id (UUID, FK to businesses)
  - user_id (UUID, FK to auth.users)
  - document_type
  - file_name
  - file_path (Supabase Storage path)
  - file_size
  - uploaded_at

- **profile_documents**
  - id (UUID, PK)
  - user_id (UUID, FK to auth.users)
  - document_type
  - file_name
  - file_path (Supabase Storage path)
  - file_size
  - uploaded_at

#### 7.1.11 Activity Logging
- **activity_logs**
  - id (UUID, PK)
  - user_id (UUID, FK to auth.users)
  - business_id (UUID, FK to businesses, nullable)
  - action
  - entity_type
  - entity_id
  - metadata (JSONB)
  - ip_address
  - user_agent
  - created_at

### 7.2 Database Functions

- **generate_application_number()**: Auto-generate unique loan application numbers
- **has_role(user_id, role)**: Check if user has specific role
- **is_system_admin(user_id)**: Check if user is system admin
- **is_ngo_admin(ngo_id, user_id)**: Check if user is admin of specific NGO
- **is_business_member(business_id, user_id)**: Check if user is member of business
- **user_has_page_access(business_id, page, user_id)**: Check if user can access specific page
- **user_ngo_id(user_id)**: Get NGO ID for NGO admin user
- **authenticated_user_email()**: Get email of current authenticated user

### 7.3 Row Level Security (RLS) Policies

All tables have RLS enabled with policies for:
- **SELECT**: Users can view own data, business members can view business data, admins can view all
- **INSERT**: Users can insert into own business, admins can insert anywhere
- **UPDATE**: Users can update own data, business owners can update business data, admins can update all
- **DELETE**: Restricted to owners and admins

---

## 8. Security Requirements

### 8.1 Authentication Security
- Password minimum requirements: 8 characters
- Password hashing: bcrypt with salt
- Session tokens: JWT with expiration
- Token refresh mechanism
- Account lockout after 5 failed login attempts
- Password reset via email verification
- Email verification required for new accounts

### 8.2 Authorization Security
- Role-based access control (RBAC)
- Row-level security (RLS) in database
- Granular page-level permissions for team members
- API endpoint authorization checks
- Business ownership verification
- NGO admin scope enforcement

### 8.3 Data Security
- All API calls over HTTPS (TLS 1.3)
- Database encryption at rest
- Secure file storage with access controls
- Sensitive data masking in logs
- Input validation and sanitization
- SQL injection prevention via parameterized queries
- XSS prevention via output encoding
- CSRF protection via token validation

### 8.4 Privacy & Compliance
- GDPR compliance:
  - User consent for data processing
  - Right to data access
  - Right to data deletion
  - Right to data portability
  - Data breach notification procedures
- Privacy policy displayed during registration
- Terms of service acceptance required
- Audit logging for data access and modifications
- Data retention policies

### 8.5 File Upload Security
- File type validation (whitelist)
- File size limits (20MB per file)
- Virus scanning (if available)
- Secure file storage with restricted access
- Signed URLs for file access with expiration

---

## 9. Integration Requirements

### 9.1 Email Service Integration
- **Provider**: Resend API
- **Use Cases**:
  - User registration confirmation
  - Password reset links
  - Team member invitations
  - Invoice delivery
  - Loan application status updates
  - Fund disbursement notifications
  - Birthday reminders
  - Payment reminders
- **Features**:
  - Email templates
  - Tracking (sent, delivered, opened)
  - Attachments (PDFs)
  - Batch sending

### 9.2 SMS Service Integration (Optional)
- **Use Cases**:
  - Two-factor authentication (2FA)
  - Payment reminders
  - Low stock alerts
  - Birthday reminders
  - Critical notifications
- **Features**:
  - Delivery confirmation
  - International support
  - Opt-in/opt-out management

### 9.3 Payment Gateway Integration (Future)
- Support for online payments
- Payment methods: Credit/Debit cards, Mobile money
- PCI-DSS compliance
- Payment reconciliation
- Refund processing

### 9.4 Accounting Software Integration (Future)
- Export data to QuickBooks, Xero, etc.
- Sync transactions
- Chart of accounts mapping

### 9.5 API & Webhooks
- RESTful API for third-party integrations
- Webhook support for event notifications:
  - New sale created
  - Invoice paid
  - Low stock alert
  - Loan application status changed
  - Disbursement approved
- API authentication via API keys
- Rate limiting for API calls
- API documentation (OpenAPI/Swagger)

---

## Appendices

### Appendix A: Glossary

- **MSME**: Micro, Small, and Medium Enterprises
- **NGO**: Non-Governmental Organization
- **RLS**: Row Level Security - Database-level access control
- **2FA**: Two-Factor Authentication
- **KYC**: Know Your Customer
- **GDPR**: General Data Protection Regulation
- **API**: Application Programming Interface
- **JWT**: JSON Web Token
- **CRUD**: Create, Read, Update, Delete
- **SKU**: Stock Keeping Unit
- **P&L**: Profit and Loss Statement
- **B2B**: Business to Business
- **B2C**: Business to Consumer

### Appendix B: Acronyms

- **SRS**: Software Requirements Specification
- **FR**: Functional Requirement
- **NFR**: Non-Functional Requirement
- **UI**: User Interface
- **UX**: User Experience
- **PDF**: Portable Document Format
- **CSV**: Comma-Separated Values
- **JSON**: JavaScript Object Notation
- **SQL**: Structured Query Language
- **HTTPS**: Hypertext Transfer Protocol Secure
- **TLS**: Transport Layer Security

### Appendix C: Change Log

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-11-24 | System Team | Initial SRS document created covering all modules |

### Appendix D: Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| System Architect | | | |
| Development Lead | | | |
| QA Lead | | | |

---

**End of Document**
