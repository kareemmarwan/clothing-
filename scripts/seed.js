const https = require('https')

const SUPABASE_URL = 'https://qejqsijsoeallzqtkmuw.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlanFzaWpzb2VhbGx6cXRrbXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODg1NDEyNCwiZXhwIjoyMTA0NDMwMTI0fQ.FpUL5aLB1WKmX_MVKdE30IUKuGxJwN092pDVHe3L_sY'

function query(table, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
    if (method === 'GET' || method === 'DELETE') {
      url.searchParams.set('select', '*')
    }

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : undefined,
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '[]'))
        } else {
          reject(new Error(`${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

async function seed() {
  console.log('🚀 بدء تعبئة البيانات...\n')

  // 1. Products
  console.log('📦 إضافة الأصناف...')
  const products = [
    { name: 'قميص رجالي كلاسيك', category: 'رجالي', type: 'قميص', size: 'L', color: 'أبيض', cost_price: 45, sale_price: 80, quantity_imported: 200 },
    { name: 'قميص رجالي كلاسيك', category: 'رجالي', type: 'قميص', size: 'XL', color: 'أبيض', cost_price: 48, sale_price: 85, quantity_imported: 150 },
    { name: 'قميص رجالي كلاسيك', category: 'رجالي', type: 'قميص', size: 'L', color: 'أزرق', cost_price: 45, sale_price: 80, quantity_imported: 180 },
    { name: 'بنطال جينز رجالي', category: 'رجالي', type: 'بنطال', size: '32', color: 'أزرق داكن', cost_price: 65, sale_price: 120, quantity_imported: 250 },
    { name: 'بنطال جينز رجالي', category: 'رجالي', type: 'بنطال', size: '34', color: 'أزرق داكن', cost_price: 68, sale_price: 125, quantity_imported: 200 },
    { name: 'بنطال جينز رجالي', category: 'رجالي', type: 'بنطال', size: '36', color: 'أسود', cost_price: 70, sale_price: 130, quantity_imported: 180 },
    { name: 'ثوب رجالي صيفي', category: 'رجالي', type: 'ثوب', size: '56', color: 'أبيض', cost_price: 55, sale_price: 100, quantity_imported: 300 },
    { name: 'ثوب رجالي صيفي', category: 'رجالي', type: 'ثوب', size: '58', color: 'أبيض', cost_price: 58, sale_price: 105, quantity_imported: 250 },
    { name: 'ثوب رجالي شتوي', category: 'رجالي', type: 'ثوب', size: '56', color: 'رمادي', cost_price: 75, sale_price: 140, quantity_imported: 200 },
    { name: 'عباية نسائي كلاسيك', category: 'حريمي', type: 'عباية', size: 'M', color: 'أسود', cost_price: 80, sale_price: 150, quantity_imported: 300 },
    { name: 'عباية نسائي كلاسيك', category: 'حريمي', type: 'عباية', size: 'L', color: 'أسود', cost_price: 85, sale_price: 160, quantity_imported: 250 },
    { name: 'عباية نسائي مطرز', category: 'حريمي', type: 'عباية', size: 'M', color: 'أسود', cost_price: 120, sale_price: 220, quantity_imported: 150 },
    { name: 'فستان نسائي صيفي', category: 'حريمي', type: 'فستان', size: 'S', color: 'وردي', cost_price: 70, sale_price: 130, quantity_imported: 120 },
    { name: 'فستان نسائي صيفي', category: 'حريمي', type: 'فستان', size: 'M', color: 'أزرق', cost_price: 75, sale_price: 140, quantity_imported: 100 },
    { name: 'بلوزة نسائي', category: 'حريمي', type: 'بلوزة', size: 'M', color: 'أبيض', cost_price: 35, sale_price: 65, quantity_imported: 200 },
    { name: 'بلوزة نسائي', category: 'حريمي', type: 'بلوزة', size: 'L', color: 'أسود', cost_price: 38, sale_price: 70, quantity_imported: 180 },
    { name: 'جاكيت رجالي', category: 'رجالي', type: 'جاكيت', size: 'L', color: 'أسود', cost_price: 150, sale_price: 280, quantity_imported: 100 },
    { name: 'جاكيت رجالي', category: 'رجالي', type: 'جاكيت', size: 'XL', color: 'بني', cost_price: 160, sale_price: 300, quantity_imported: 80 },
    { name: 'تنورة نسائي', category: 'حريمي', type: 'تنورة', size: 'M', color: 'أسود', cost_price: 45, sale_price: 85, quantity_imported: 150 },
    { name: 'شورت رجالي', category: 'رجالي', type: 'شورت', size: 'L', color: 'رمادي', cost_price: 30, sale_price: 55, quantity_imported: 200 },
  ]

  const insertedProducts = await query('products', 'POST', products)
  console.log(`   ✅ تم إضافة ${insertedProducts.length} صنف`)

  // Inventory movements for imports
  console.log('   📝 إضافة حركات المخزون...')
  const importMovements = insertedProducts.map(p => ({
    product_id: p.id, movement_type: 'import', quantity: p.quantity_imported, notes: 'استيراد أولي'
  }))
  await query('inventory_movements', 'POST', importMovements)
  console.log(`   ✅ تم إضافة ${importMovements.length} حركة استيراد`)

  // 2. Merchants
  console.log('\n👥 إضافة التجار...')
  const merchants = [
    { name: 'أحمد محمد الراشد', phone: '0501234567', address: 'الرياض - حي النزهة', notes: 'تاجر موثوق' },
    { name: 'خالد عبدالله العمري', phone: '0507654321', address: 'جدة - حي الروضة', notes: 'عميل من سنتين' },
    { name: 'محمد علي الشمري', phone: '0509876543', address: 'الدمام - حي الفيصلية', notes: 'عميل جديد' },
    { name: 'عبدالرحمن سعيد الدوسري', phone: '0502468135', address: 'الرياض - حي العليا', notes: 'كميات كبيرة' },
    { name: 'فهد ناصر القحطاني', phone: '0503691472', address: 'مكة - حي العزيزية', notes: 'تاجر قديم' },
    { name: 'سعد محمد الحربي', phone: '0508529637', address: 'المدينة - حي قباء', notes: '' },
    { name: 'عمر أحمد المطيري', phone: '0501472583', address: 'تبوك - حي الصناعية', notes: 'دفعات منتظمة' },
    { name: 'ناصر فهد الشمري', phone: '0509638521', address: 'حائل - حي الشفا', notes: '' },
  ]

  const insertedMerchants = await query('merchants', 'POST', merchants)
  console.log(`   ✅ تم إضافة ${insertedMerchants.length} تاجر`)

  // 3. Invoices
  console.log('\n🧾 إضافة الفواتير...')
  const invoicesData = [
    { mi: 0, days: 45, items: [{ pi: 0, qty: 50 }, { pi: 3, qty: 30 }, { pi: 6, qty: 40 }], pay: 1.0 },
    { mi: 0, days: 20, items: [{ pi: 9, qty: 60 }, { pi: 12, qty: 20 }], pay: 0.4 },
    { mi: 1, days: 35, items: [{ pi: 1, qty: 40 }, { pi: 4, qty: 35 }, { pi: 7, qty: 50 }], pay: 1.0 },
    { mi: 1, days: 10, items: [{ pi: 10, qty: 30 }, { pi: 14, qty: 40 }], pay: 0.0 },
    { mi: 2, days: 28, items: [{ pi: 2, qty: 60 }, { pi: 5, qty: 45 }], pay: 0.6 },
    { mi: 2, days: 5, items: [{ pi: 11, qty: 25 }, { pi: 15, qty: 30 }], pay: 0.0 },
    { mi: 3, days: 50, items: [{ pi: 0, qty: 80 }, { pi: 6, qty: 60 }, { pi: 9, qty: 50 }], pay: 0.8 },
    { mi: 4, days: 30, items: [{ pi: 3, qty: 55 }, { pi: 16, qty: 20 }], pay: 1.0 },
    { mi: 4, days: 15, items: [{ pi: 13, qty: 35 }, { pi: 18, qty: 40 }], pay: 0.3 },
    { mi: 5, days: 22, items: [{ pi: 1, qty: 45 }, { pi: 4, qty: 30 }, { pi: 7, qty: 35 }], pay: 0.5 },
    { mi: 6, days: 18, items: [{ pi: 2, qty: 50 }, { pi: 5, qty: 40 }, { pi: 17, qty: 15 }], pay: 1.0 },
    { mi: 7, days: 8, items: [{ pi: 9, qty: 70 }, { pi: 12, qty: 30 }, { pi: 19, qty: 50 }], pay: 0.0 },
    { mi: 0, days: 3, items: [{ pi: 16, qty: 10 }, { pi: 17, qty: 8 }], pay: 0.0 },
    { mi: 3, days: 2, items: [{ pi: 11, qty: 15 }, { pi: 12, qty: 10 }], pay: 0.0 },
  ]

  let invoiceCount = 0
  let paymentCount = 0

  for (const inv of invoicesData) {
    const merchant = insertedMerchants[inv.mi]
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`
    const createdAt = new Date(Date.now() - inv.days * 24 * 60 * 60 * 1000).toISOString()

    let totalAmount = 0
    const items = inv.items.map(item => {
      const product = insertedProducts[item.pi]
      const lineTotal = item.qty * product.sale_price
      totalAmount += lineTotal
      return { product_id: product.id, quantity: item.qty, unit_price: product.sale_price, line_total: lineTotal }
    })

    const paidAmount = Math.floor(totalAmount * inv.pay)
    const status = inv.pay >= 1 ? 'paid' : inv.pay > 0 ? 'partial' : 'unpaid'

    // Create invoice
    const invoices = await query('invoices', 'POST', {
      merchant_id: merchant.id, invoice_number: invoiceNumber,
      total_amount: totalAmount, paid_amount: paidAmount,
      remaining_amount: totalAmount - paidAmount, status, created_at: createdAt
    })
    const invoice = invoices[0]

    // Invoice items
    await query('invoice_items', 'POST', items.map(item => ({ invoice_id: invoice.id, ...item })))

    // Sale movements
    const saleMovements = inv.items.map(item => ({
      product_id: insertedProducts[item.pi].id,
      movement_type: 'sale', quantity: item.qty,
      reference_id: invoice.id, notes: `فاتورة ${invoiceNumber}`, created_at: createdAt
    }))
    await query('inventory_movements', 'POST', saleMovements)

    // Payments
    if (paidAmount > 0) {
      const numPayments = inv.pay >= 1 ? 2 : 1
      let remaining = paidAmount
      for (let i = 0; i < numPayments; i++) {
        const amt = i === numPayments - 1 ? remaining : Math.floor(remaining * 0.6)
        remaining -= amt
        const payDate = new Date(Date.now() - (inv.days - i * 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        await query('payments', 'POST', {
          invoice_id: invoice.id, merchant_id: merchant.id, amount: amt,
          payment_method: i === 0 ? 'نقدي' : 'تحويل بنكي', payment_date: payDate,
          notes: i === 0 ? 'دفعة أولى' : 'دفعة ثانية'
        })
        paymentCount++
      }
    }
    invoiceCount++
  }
  console.log(`   ✅ تم إضافة ${invoiceCount} فاتورة`)
  console.log(`   ✅ تم إضافة ${paymentCount} دفعة`)

  // 4. Losses
  console.log('\n⚠️ إضافة الفاقد...')
  const losses = [
    { pi: 0, qty: 5, reason: 'تالف', days: 20 },
    { pi: 3, qty: 3, reason: 'عيب', days: 25 },
    { pi: 6, qty: 8, reason: 'مفقود', days: 15 },
    { pi: 9, qty: 4, reason: 'تالف', days: 30 },
    { pi: 12, qty: 2, reason: 'عيب', days: 10 },
    { pi: 16, qty: 6, reason: 'تالف', days: 12 },
    { pi: 18, qty: 3, reason: 'مفقود', days: 8 },
  ]

  const lossesData = losses.map(l => {
    const product = insertedProducts[l.pi]
    return {
      product_id: product.id, quantity: l.qty, reason: l.reason,
      cost_impact: l.qty * product.cost_price, notes: `فاقد بسبب ${l.reason}`,
      created_at: new Date(Date.now() - l.days * 24 * 60 * 60 * 1000).toISOString()
    }
  })

  await query('losses', 'POST', lossesData)

  const lossMovements = losses.map(l => ({
    product_id: insertedProducts[l.pi].id,
    movement_type: 'loss', quantity: l.qty, notes: `فاقد - ${l.reason}`,
    created_at: new Date(Date.now() - l.days * 24 * 60 * 60 * 1000).toISOString()
  }))
  await query('inventory_movements', 'POST', lossMovements)
  console.log(`   ✅ تم إضافة ${losses.length} سجل فاقد`)

  console.log('\n' + '='.repeat(50))
  console.log('✅ تم تعبئة جميع البيانات بنجاح!')
  console.log('='.repeat(50))
  console.log(`📦 الأصناف: ${insertedProducts.length}`)
  console.log(`👥 التجار: ${insertedMerchants.length}`)
  console.log(`🧾 الفواتير: ${invoiceCount}`)
  console.log(`💰 الدفعات: ${paymentCount}`)
  console.log(`⚠️ الفاقد: ${losses.length}`)
}

seed().catch(err => console.error('❌ خطأ:', err.message))
