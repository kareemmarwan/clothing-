'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg])

  const seedData = async () => {
    setIsLoading(true)
    setLogs([])

    try {
      // 1. Products
      addLog('جاري إضافة الأصناف...')
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

      const { data: insertedProducts, error: productsError } = await supabase
        .from('products')
        .insert(products)
        .select()

      if (productsError) throw productsError
      addLog(`تم إضافة ${insertedProducts.length} صنف`)

      // Create inventory movements for products
      addLog('جاري إضافة حركات المخزون...')
      const importMovements = insertedProducts.map((p) => ({
        product_id: p.id,
        movement_type: 'import' as const,
        quantity: p.quantity_imported,
        notes: 'استيراد أولي',
      }))

      const { error: movementsError } = await supabase
        .from('inventory_movements')
        .insert(importMovements)

      if (movementsError) throw movementsError
      addLog(`تم إضافة ${importMovements.length} حركة مخزون`)

      // 2. Merchants
      addLog('جاري إضافة التجار...')
      const merchants = [
        { name: 'أحمد محمد', phone: '0501234567', address: 'الرياض - حي النزهة', notes: 'تاجر موثوق' },
        { name: 'خالد عبدالله', phone: '0507654321', address: 'جدة - حي الروضة', notes: '' },
        { name: 'محمد علي', phone: '0509876543', address: 'الدمام - حي الفيصلية', notes: 'عميل جديد' },
        { name: 'عبدالرحمن سعيد', phone: '0502468135', address: 'الرياض - حي العليا', notes: '' },
        { name: 'فهد ناصر', phone: '0503691472', address: 'مكة - حي العزيزية', notes: 'تاجر قديم' },
        { name: 'سعد القحطاني', phone: '0508529637', address: 'المدينة - حي قباء', notes: '' },
        { name: 'عمر الحربي', phone: '0501472583', address: 'تبوك - حي الصناعية', notes: '' },
        { name: 'ناصر الشمري', phone: '0509638521', address: 'حائل - حي الشفا', notes: 'دفعاته منتظمة' },
      ]

      const { data: insertedMerchants, error: merchantsError } = await supabase
        .from('merchants')
        .insert(merchants)
        .select()

      if (merchantsError) throw merchantsError
      addLog(`تم إضافة ${insertedMerchants.length} تاجر`)

      // 3. Invoices with items
      addLog('جاري إضافة الفواتير...')
      const invoicesData = [
        { merchantIdx: 0, daysAgo: 30, items: [{ productIdx: 0, qty: 50 }, { productIdx: 3, qty: 30 }, { productIdx: 6, qty: 40 }] },
        { merchantIdx: 0, daysAgo: 15, items: [{ productIdx: 9, qty: 60 }, { productIdx: 12, qty: 20 }] },
        { merchantIdx: 1, daysAgo: 25, items: [{ productIdx: 1, qty: 40 }, { productIdx: 4, qty: 35 }, { productIdx: 7, qty: 50 }] },
        { merchantIdx: 1, daysAgo: 10, items: [{ productIdx: 10, qty: 30 }, { productIdx: 14, qty: 40 }] },
        { merchantIdx: 2, daysAgo: 20, items: [{ productIdx: 2, qty: 60 }, { productIdx: 5, qty: 45 }] },
        { merchantIdx: 2, daysAgo: 5, items: [{ productIdx: 11, qty: 25 }, { productIdx: 15, qty: 30 }] },
        { merchantIdx: 3, daysAgo: 35, items: [{ productIdx: 0, qty: 80 }, { productIdx: 6, qty: 60 }, { productIdx: 9, qty: 50 }] },
        { merchantIdx: 4, daysAgo: 28, items: [{ productIdx: 3, qty: 55 }, { productIdx: 16, qty: 20 }] },
        { merchantIdx: 4, daysAgo: 12, items: [{ productIdx: 13, qty: 35 }, { productIdx: 18, qty: 40 }] },
        { merchantIdx: 5, daysAgo: 18, items: [{ productIdx: 1, qty: 45 }, { productIdx: 4, qty: 30 }, { productIdx: 7, qty: 35 }] },
        { merchantIdx: 6, daysAgo: 22, items: [{ productIdx: 2, qty: 50 }, { productIdx: 5, qty: 40 }, { productIdx: 17, qty: 15 }] },
        { merchantIdx: 7, daysAgo: 8, items: [{ productIdx: 9, qty: 70 }, { productIdx: 12, qty: 30 }, { productIdx: 19, qty: 50 }] },
      ]

      let invoiceCount = 0
      for (const invData of invoicesData) {
        const merchant = insertedMerchants[invData.merchantIdx]
        const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`
        const createdAt = new Date(Date.now() - invData.daysAgo * 24 * 60 * 60 * 1000).toISOString()

        // Calculate total
        let totalAmount = 0
        const items = invData.items.map((item) => {
          const product = insertedProducts[item.productIdx]
          const lineTotal = item.qty * product.sale_price
          totalAmount += lineTotal
          return {
            product_id: product.id,
            quantity: item.qty,
            unit_price: product.sale_price,
            line_total: lineTotal,
          }
        })

        // Random payment status
        const paymentRatio = Math.random()
        let paidAmount = 0
        let status: 'paid' | 'partial' | 'unpaid' = 'unpaid'
        if (paymentRatio > 0.6) {
          paidAmount = totalAmount
          status = 'paid'
        } else if (paymentRatio > 0.3) {
          paidAmount = Math.floor(totalAmount * (0.3 + Math.random() * 0.5))
          status = 'partial'
        }

        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            merchant_id: merchant.id,
            invoice_number: invoiceNumber,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            remaining_amount: totalAmount - paidAmount,
            status,
            created_at: createdAt,
          })
          .select()
          .single()

        if (invoiceError) throw invoiceError

        // Insert invoice items
        const invoiceItems = items.map((item) => ({
          invoice_id: invoice.id,
          ...item,
        }))

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems)

        if (itemsError) throw itemsError

        // Create sale inventory movements
        const saleMovements = invData.items.map((item) => ({
          product_id: insertedProducts[item.productIdx].id,
          movement_type: 'sale' as const,
          quantity: item.qty,
          reference_id: invoice.id,
          notes: `فاتورة رقم ${invoiceNumber}`,
          created_at: createdAt,
        }))

        const { error: saleMovementsError } = await supabase
          .from('inventory_movements')
          .insert(saleMovements)

        if (saleMovementsError) throw saleMovementsError

        // Insert payment if partial
        if (paidAmount > 0 && status === 'partial') {
          const paymentDate = new Date(Date.now() - (invData.daysAgo - 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          const { error: paymentError } = await supabase.from('payments').insert({
            invoice_id: invoice.id,
            merchant_id: merchant.id,
            amount: paidAmount,
            payment_method: Math.random() > 0.5 ? 'نقدي' : 'تحويل بنكي',
            payment_date: paymentDate,
            notes: 'دفعة أولى',
          })

          if (paymentError) throw paymentError
        }

        invoiceCount++
      }
      addLog(`تم إضافة ${invoiceCount} فاتورة مع الأصناف والدفعات`)

      // 4. Losses
      addLog('جاري إضافة سجلات الفاقد...')
      const losses = [
        { productIdx: 0, quantity: 5, reason: 'تالف', daysAgo: 15 },
        { productIdx: 3, quantity: 3, reason: 'عيب', daysAgo: 20 },
        { productIdx: 6, quantity: 8, reason: 'مفقود', daysAgo: 10 },
        { productIdx: 9, quantity: 4, reason: 'تالف', daysAgo: 25 },
        { productIdx: 12, quantity: 2, reason: 'عيب', daysAgo: 7 },
        { productIdx: 16, quantity: 6, reason: 'تالف', daysAgo: 18 },
      ]

      const lossesData = losses.map((l) => {
        const product = insertedProducts[l.productIdx]
        return {
          product_id: product.id,
          quantity: l.quantity,
          reason: l.reason,
          cost_impact: l.quantity * product.cost_price,
          notes: `فاقد بسبب ${l.reason}`,
          created_at: new Date(Date.now() - l.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        }
      })

      const { error: lossesError } = await supabase
        .from('losses')
        .insert(lossesData)

      if (lossesError) throw lossesError

      // Create loss inventory movements
      const lossMovements = losses.map((l) => ({
        product_id: insertedProducts[l.productIdx].id,
        movement_type: 'loss' as const,
        quantity: l.quantity,
        notes: `فاقد - ${l.reason}`,
        created_at: new Date(Date.now() - l.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      }))

      const { error: lossMovementsError } = await supabase
        .from('inventory_movements')
        .insert(lossMovements)

      if (lossMovementsError) throw lossMovementsError
      addLog(`تم إضافة ${losses.length} سجل فاقد`)

      addLog('')
      addLog('✅ تم إنشاء جميع البيانات بنجاح!')
      addLog('يمكنك الآن الذهاب إلى لوحة التحكم لرؤية البيانات')

    } catch (error: any) {
      addLog(`❌ خطأ: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <h1 className="text-2xl font-bold mb-4">تعبئة البيانات الوهمية</h1>
          <p className="text-gray-600 mb-6">
            سيقوم هذا بتحميل بيانات وهمية تشمل: 20 صنف، 8 تجار، 12 فاتورة، وسجلات فاقد
          </p>

          <Button
            onClick={seedData}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full mb-6"
          >
            {isLoading ? 'جاري التحميل...' : 'بدء تعبئة البيانات'}
          </Button>

          {logs.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="py-0.5">
                  {log}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
