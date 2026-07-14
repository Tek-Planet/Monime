import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sierra Leone specific data
const sierraLeoneLocations = [
  'Freetown', 'Bo', 'Kenema', 'Makeni', 'Koidu', 'Waterloo', 'Port Loko', 'Lunsar',
  'Kabala', 'Moyamba', 'Magburaka', 'Kambia', 'Bonthe', 'Pujehun', 'Kailahun'
]

const africanFirstNames = [
  'Aminata', 'Mohamed', 'Fatmata', 'Ibrahim', 'Mariama', 'Abdul', 'Isata', 'Hassan',
  'Kadiatu', 'Foday', 'Hawa', 'Sorie', 'Tenneh', 'Osman', 'Bintu', 'Alimamy',
  'Mabinty', 'Lansana', 'Yeabu', 'Brima', 'Miatta', 'Alhaji', 'Adama', 'Musa',
  'Fatu', 'Saidu', 'Sia', 'Alie', 'Ramatu', 'Sahr', 'Jeneba', 'Mustapha',
  'Zainab', 'Amadu', 'Haja', 'Tamba', 'Ishmael', 'Khadija', 'Moses', 'Sarah',
  'Emmanuel', 'Josephine', 'Samuel', 'Mary', 'David', 'Comfort', 'Joseph', 'Grace'
]

const africanLastNames = [
  'Kamara', 'Koroma', 'Sesay', 'Bangura', 'Conteh', 'Turay', 'Jalloh', 'Mansaray',
  'Kargbo', 'Fofanah', 'Suma', 'Kamanda', 'Samura', 'Bah', 'Barrie', 'Dumbuya',
  'Fornah', 'Kanu', 'Kallon', 'Williams', 'Johnson', 'Davies', 'Cole', 'George',
  'Thomas', 'Rogers', 'Tucker', 'Pratt', 'Smith', 'Brown', 'Peters', 'Wilson'
]

const businessTypes = [
  'Retail Shop', 'Restaurant', 'Grocery Store', 'Clothing Store', 'Electronics Shop',
  'Pharmacy', 'Hardware Store', 'Mobile Money Agent', 'Hair Salon', 'Tailoring Shop',
  'Internet Cafe', 'Market Stall', 'Bakery', 'Auto Parts', 'Furniture Shop'
]

const productCategories = [
  'Food & Beverages', 'Clothing & Textiles', 'Electronics', 'Hardware & Tools',
  'Household Items', 'Personal Care', 'Medicines', 'Mobile Accessories', 'Stationery'
]

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePhone(): string {
  const prefixes = ['076', '077', '078', '079', '030', '031', '032', '033']
  return `${randomElement(prefixes)}${randomNumber(100000, 999999)}`
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNumber(1, 999)}@${randomElement(domains)}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { count = 1000 } = await req.json()
    const results = {
      users: 0,
      businesses: 0,
      customers: 0,
      suppliers: 0,
      inventory: 0,
      sales: 0,
      expenses: 0,
      invoices: 0
    }

    // Create users and profiles
    console.log('Creating users...')
    const userIds: string[] = []
    
    for (let i = 0; i < Math.min(count, 100); i++) {
      const firstName = randomElement(africanFirstNames)
      const lastName = randomElement(africanLastNames)
      const email = generateEmail(firstName, lastName)
      const password = 'Demo@123456'

      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { first_name: firstName, last_name: lastName }
        })

        if (userError) {
          console.log(`Skipping user ${email}: ${userError.message}`)
          continue
        }

        if (userData.user) {
          userIds.push(userData.user.id)
          
          await supabaseAdmin.from('profiles').upsert({
            user_id: userData.user.id,
            first_name: firstName,
            last_name: lastName,
            email,
            phone: generatePhone()
          })
          
          results.users++
        }
      } catch (e: any) {
        console.log(`Error creating user: ${e?.message || 'Unknown error'}`)
      }
    }

    console.log(`Created ${results.users} users`)

    // Create businesses
    console.log('Creating businesses...')
    const businessIds: string[] = []
    
    for (const userId of userIds) {
      const businessName = `${randomElement(africanFirstNames)}'s ${randomElement(businessTypes)}`
      
      const { data: business, error: bizError } = await supabaseAdmin
        .from('businesses')
        .insert({
          owner_id: userId,
          business_name: businessName,
          business_type: randomElement(businessTypes),
          email: generateEmail('business', businessName.split(' ')[0]),
          phone: generatePhone(),
          address: `${randomNumber(1, 200)} ${randomElement(['Main', 'Market', 'King', 'Queen'])} Street, ${randomElement(sierraLeoneLocations)}`,
          currency: 'SLL',
          tax_rate: 0.15
        })
        .select()
        .single()

      if (!bizError && business) {
        businessIds.push(business.id)
        results.businesses++
      }
    }

    console.log(`Created ${results.businesses} businesses`)

    // Create customers for each business
    console.log('Creating customers...')
    for (const businessId of businessIds) {
      const numCustomers = randomNumber(5, 20)
      const { data: bizData } = await supabaseAdmin
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()

      if (!bizData) continue

      for (let i = 0; i < numCustomers; i++) {
        const firstName = randomElement(africanFirstNames)
        const lastName = randomElement(africanLastNames)
        
        const { error: custError } = await supabaseAdmin
          .from('customers')
          .insert({
            user_id: bizData.owner_id,
            business_id: businessId,
            name: `${firstName} ${lastName}`,
            email: generateEmail(firstName, lastName),
            phone: generatePhone(),
            address: `${randomElement(sierraLeoneLocations)}`,
            credit_limit: randomNumber(100000, 5000000),
            current_balance: randomNumber(0, 500000)
          })

        if (!custError) results.customers++
      }
    }

    console.log(`Created ${results.customers} customers`)

    // Create suppliers for each business
    console.log('Creating suppliers...')
    for (const businessId of businessIds) {
      const numSuppliers = randomNumber(3, 10)
      const { data: bizData } = await supabaseAdmin
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()

      if (!bizData) continue

      for (let i = 0; i < numSuppliers; i++) {
        const { error: suppError } = await supabaseAdmin
          .from('suppliers')
          .insert({
            user_id: bizData.owner_id,
            business_id: businessId,
            name: `${randomElement(africanFirstNames)} ${randomElement(['Traders', 'Suppliers', 'Wholesale', 'Enterprises'])}`,
            phone: generatePhone(),
            location: randomElement(sierraLeoneLocations),
            product_category: randomElement(productCategories),
            current_balance: randomNumber(0, 1000000)
          })

        if (!suppError) results.suppliers++
      }
    }

    console.log(`Created ${results.suppliers} suppliers`)

    // Create inventory items
    console.log('Creating inventory...')
    const productNames = [
      'Rice', 'Oil', 'Sugar', 'Flour', 'Soap', 'Detergent', 'T-Shirt', 'Jeans', 'Shoes',
      'Phone Charger', 'Mobile Phone', 'Laptop', 'Hammer', 'Nails', 'Paint', 'Notebook',
      'Pen', 'Pencil', 'Medicine', 'Vitamins', 'Face Mask', 'Hand Sanitizer'
    ]

    for (const businessId of businessIds) {
      const numItems = randomNumber(10, 30)
      const { data: bizData } = await supabaseAdmin
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()

      if (!bizData) continue

      for (let i = 0; i < numItems; i++) {
        const costPrice = randomNumber(1000, 50000)
        const unitPrice = costPrice * (1 + randomNumber(20, 100) / 100)

        const { error: invError } = await supabaseAdmin
          .from('inventory')
          .insert({
            user_id: bizData.owner_id,
            business_id: businessId,
            name: randomElement(productNames),
            category: randomElement(productCategories),
            stock_quantity: randomNumber(10, 500),
            unit_price: unitPrice,
            cost_price: costPrice,
            min_stock_level: randomNumber(5, 20),
            sku: `SKU-${randomNumber(10000, 99999)}`
          })

        if (!invError) results.inventory++
      }
    }

    console.log(`Created ${results.inventory} inventory items`)

    // Create sales
    console.log('Creating sales...')
    for (const businessId of businessIds) {
      const numSales = randomNumber(20, 50)
      const { data: bizData } = await supabaseAdmin
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()

      const { data: customers } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('business_id', businessId)
        .limit(10)

      if (!bizData || !customers) continue

      for (let i = 0; i < numSales; i++) {
        const daysAgo = randomNumber(0, 90)
        const saleDate = new Date()
        saleDate.setDate(saleDate.getDate() - daysAgo)

        const { error: saleError } = await supabaseAdmin
          .from('sales')
          .insert({
            user_id: bizData.owner_id,
            business_id: businessId,
            customer_id: customers.length > 0 ? randomElement(customers).id : null,
            total_amount: randomNumber(10000, 500000),
            payment_method: randomElement(['cash', 'mobile_money', 'credit']),
            sale_date: saleDate.toISOString().split('T')[0]
          })

        if (!saleError) results.sales++
      }
    }

    console.log(`Created ${results.sales} sales`)

    // Create expenses
    console.log('Creating expenses...')
    for (const businessId of businessIds) {
      const numExpenses = randomNumber(10, 30)
      const { data: bizData } = await supabaseAdmin
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()

      const { data: suppliers } = await supabaseAdmin
        .from('suppliers')
        .select('id')
        .eq('business_id', businessId)
        .limit(5)

      if (!bizData) continue

      const expenseCategories = ['Rent', 'Utilities', 'Supplies', 'Transportation', 'Staff Salary']

      for (let i = 0; i < numExpenses; i++) {
        const daysAgo = randomNumber(0, 90)
        const expenseDate = new Date()
        expenseDate.setDate(expenseDate.getDate() - daysAgo)

        const { error: expError } = await supabaseAdmin
          .from('expenses')
          .insert({
            user_id: bizData.owner_id,
            business_id: businessId,
            supplier_id: suppliers && suppliers.length > 0 ? randomElement(suppliers).id : null,
            description: randomElement(expenseCategories),
            category: randomElement(expenseCategories),
            amount: randomNumber(50000, 2000000),
            payment_method: randomElement(['cash', 'mobile_money', 'credit']),
            expense_date: expenseDate.toISOString().split('T')[0]
          })

        if (!expError) results.expenses++
      }
    }

    console.log(`Created ${results.expenses} expenses`)

    // Create invoices
    console.log('Creating invoices...')
    for (const businessId of businessIds) {
      const numInvoices = randomNumber(5, 15)
      const { data: bizData } = await supabaseAdmin
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()

      const { data: customers } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('business_id', businessId)
        .limit(10)

      if (!bizData || !customers || customers.length === 0) continue

      for (let i = 0; i < numInvoices; i++) {
        const daysAgo = randomNumber(0, 60)
        const invoiceDate = new Date()
        invoiceDate.setDate(invoiceDate.getDate() - daysAgo)
        
        const dueDate = new Date(invoiceDate)
        dueDate.setDate(dueDate.getDate() + randomNumber(7, 30))

        const subtotal = randomNumber(50000, 1000000)
        const taxAmount = subtotal * 0.15
        const totalAmount = subtotal + taxAmount

        const { error: invError } = await supabaseAdmin
          .from('invoices')
          .insert({
            user_id: bizData.owner_id,
            business_id: businessId,
            customer_id: randomElement(customers).id,
            invoice_number: `INV-${Date.now()}-${randomNumber(1000, 9999)}`,
            invoice_date: invoiceDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            paid_amount: randomNumber(0, 1) > 0.7 ? totalAmount : randomNumber(0, totalAmount),
            status: randomElement(['draft', 'sent', 'paid', 'overdue'])
          })

        if (!invError) results.invoices++
      }
    }

    console.log(`Created ${results.invoices} invoices`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database seeded successfully',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Seeding error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})