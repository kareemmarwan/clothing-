import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')

    if (!reportType) {
      return NextResponse.json({ error: 'نوع التقرير مطلوب' }, { status: 400 })
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'نظام محاسبة تاجر ملابس'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet('تقرير')

    // RTL support
    worksheet.views = [{ rightToLeft: true }]

    switch (reportType) {
      case 'invoices':
        await generateInvoicesReport(worksheet)
        break
      case 'inventory':
        await generateInventoryReport(worksheet)
        break
      case 'debts':
        await generateDebtsReport(worksheet)
        break
      case 'profit-loss':
        await generateProfitLossReport(worksheet)
        break
      default:
        return NextResponse.json({ error: 'نوع التقرير غير صالح' }, { status: 400 })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const uint8Array = new Uint8Array(buffer)

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${reportType}-report.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'حدث خطأ في التصدير' }, { status: 500 })
  }
}

async function generateInvoicesReport(worksheet: ExcelJS.Worksheet) {
  const { data: invoices } = await supabaseAdmin
    .from('invoices')
    .select('*, merchants(name)')
    .order('created_at', { ascending: false })

  // Header
  worksheet.addRow(['تقرير الفواتير'])
  worksheet.addRow([])

  // Column headers
  worksheet.addRow([
    'رقم الفاتورة',
    'التاجر',
    'التاريخ',
    'الإجمالي',
    'المدفوع',
    'المتبقي',
    'الحالة',
  ])

  // Style header row
  const headerRow = worksheet.getRow(3)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  }
  headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true }

  // Data rows
  invoices?.forEach((invoice) => {
    worksheet.addRow([
      invoice.invoice_number,
      (invoice.merchants as any)?.name,
      new Date(invoice.created_at).toLocaleDateString('ar-SA'),
      invoice.total_amount,
      invoice.paid_amount,
      invoice.remaining_amount,
      invoice.status === 'paid'
        ? 'مدفوعة'
        : invoice.status === 'partial'
        ? 'مدفوعة جزئياً'
        : 'غير مدفوعة',
    ])
  })

  // Column widths
  worksheet.columns = [
    { width: 20 },
    { width: 25 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 20 },
  ]
}

async function generateInventoryReport(worksheet: ExcelJS.Worksheet) {
  const { data: products } = await supabaseAdmin
    .from('product_stock_view')
    .select('*')
    .order('name')

  // Header
  worksheet.addRow(['تقرير المخزون'])
  worksheet.addRow([])

  // Column headers
  worksheet.addRow([
    'الاسم',
    'الفئة',
    'النوع',
    'المقاس',
    'اللون',
    'سعر التكلفة',
    'سعر البيع',
    'المستورد',
    'المباع',
    'الفاقد',
    'المتبقي',
  ])

  // Style header row
  const headerRow = worksheet.getRow(3)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  }
  headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true }

  // Data rows
  products?.forEach((product) => {
    worksheet.addRow([
      product.name,
      product.category,
      product.type,
      product.size,
      product.color,
      product.cost_price,
      product.sale_price,
      product.quantity_imported,
      product.total_sold,
      product.total_lost,
      product.remaining,
    ])
  })

  // Column widths
  worksheet.columns = [
    { width: 25 },
    { width: 12 },
    { width: 15 },
    { width: 10 },
    { width: 12 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
  ]
}

async function generateDebtsReport(worksheet: ExcelJS.Worksheet) {
  const { data: debts } = await supabaseAdmin
    .from('merchant_debt_view')
    .select('*')
    .order('total_debt', { ascending: false })

  // Header
  worksheet.addRow(['تقرير المديونية'])
  worksheet.addRow([])

  // Column headers
  worksheet.addRow(['التاجر', 'الهاتف', 'إجمالي الفواتير', 'المدفوع', 'المديونية'])

  // Style header row
  const headerRow = worksheet.getRow(3)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  }
  headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true }

  // Data rows
  debts?.forEach((debt) => {
    worksheet.addRow([
      debt.merchant_name,
      debt.merchant_phone || '-',
      debt.total_invoices,
      debt.total_paid,
      debt.total_debt,
    ])
  })

  // Column widths
  worksheet.columns = [
    { width: 25 },
    { width: 15 },
    { width: 18 },
    { width: 15 },
    { width: 15 },
  ]
}

async function generateProfitLossReport(worksheet: ExcelJS.Worksheet) {
  // Get sales data
  const { data: salesItems } = await supabaseAdmin
    .from('invoice_items')
    .select('quantity, unit_price, line_total, products(cost_price)')

  let totalSales = 0
  let totalCost = 0

  salesItems?.forEach((item) => {
    totalSales += item.line_total
    totalCost += (item.products as any)?.cost_price * item.quantity || 0
  })

  const grossProfit = totalSales - totalCost

  // Get losses
  const { data: losses } = await supabaseAdmin
    .from('losses')
    .select('cost_impact')

  const totalLosses = losses?.reduce((sum, l) => sum + l.cost_impact, 0) || 0

  const netProfit = grossProfit - totalLosses

  // Header
  worksheet.addRow(['تقرير الأرباح والخسائر'])
  worksheet.addRow([])

  // Data
  worksheet.addRow(['إجمالي المبيعات', totalSales])
  worksheet.addRow(['تكلفة البضاعة المباعة', totalCost])
  worksheet.addRow(['إجمالي الربح', grossProfit])
  worksheet.addRow(['قيمة الفاقد', totalLosses])
  worksheet.addRow(['صافي الربح', netProfit])

  // Style
  const titleRow = worksheet.getRow(1)
  titleRow.font = { bold: true, size: 16 }

  const headerRow = worksheet.getRow(3)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  }
  headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true }

  // Column widths
  worksheet.columns = [{ width: 30 }, { width: 20 }]
}
