import { NextResponse } from 'next/server'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')

    if (!reportType) {
      return NextResponse.json({ error: 'نوع التقرير مطلوب' }, { status: 400 })
    }

    let doc: Document

    switch (reportType) {
      case 'invoices':
        doc = await generateInvoicesReport()
        break
      case 'inventory':
        doc = await generateInventoryReport()
        break
      case 'debts':
        doc = await generateDebtsReport()
        break
      case 'profit-loss':
        doc = await generateProfitLossReport()
        break
      default:
        return NextResponse.json({ error: 'نوع التقرير غير صالح' }, { status: 400 })
    }

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${reportType}-report.docx"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'حدث خطأ في التصدير' }, { status: 500 })
  }
}

function createHeaderRow(texts: string[]): TableRow {
  return new TableRow({
    children: texts.map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  bold: true,
                  color: 'FFFFFF',
                  font: 'Cairo',
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
          shading: {
            type: ShadingType.CLEAR,
            fill: '4472C4',
          },
        })
    ),
  })
}

function createDataRow(texts: string[]): TableRow {
  return new TableRow({
    children: texts.map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  font: 'Cairo',
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        })
    ),
  })
}

async function generateInvoicesReport(): Promise<Document> {
  const { data: invoices } = await supabaseAdmin
    .from('invoices')
    .select('*, merchants(name)')
    .order('created_at', { ascending: false })

  const rows = [
    createHeaderRow(['رقم الفاتورة', 'التاجر', 'التاريخ', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة']),
    ...(invoices?.map((invoice) =>
      createDataRow([
        invoice.invoice_number,
        (invoice.merchants as any)?.name,
        new Date(invoice.created_at).toLocaleDateString('ar-SA'),
        invoice.total_amount.toString(),
        invoice.paid_amount.toString(),
        invoice.remaining_amount.toString(),
        invoice.status === 'paid'
          ? 'مدفوعة'
          : invoice.status === 'partial'
          ? 'مدفوعة جزئياً'
          : 'غير مدفوعة',
      ])
    ) || []),
  ]

  return new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'تقرير الفواتير',
                bold: true,
                size: 32,
                font: 'Cairo',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`,
                font: 'Cairo',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
          }),
          new Table({
            rows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      },
    ],
  })
}

async function generateInventoryReport(): Promise<Document> {
  const { data: products } = await supabaseAdmin
    .from('product_stock_view')
    .select('*')
    .order('name')

  const rows = [
    createHeaderRow(['الاسم', 'الفئة', 'النوع', 'المقاس', 'اللون', 'المستورد', 'المباع', 'الفاقد', 'المتبقي']),
    ...(products?.map((product) =>
      createDataRow([
        product.name,
        product.category,
        product.type,
        product.size,
        product.color,
        product.quantity_imported.toString(),
        product.total_sold.toString(),
        product.total_lost.toString(),
        product.remaining.toString(),
      ])
    ) || []),
  ]

  return new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'تقرير المخزون',
                bold: true,
                size: 32,
                font: 'Cairo',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`,
                font: 'Cairo',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
          }),
          new Table({
            rows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      },
    ],
  })
}

async function generateDebtsReport(): Promise<Document> {
  const { data: debts } = await supabaseAdmin
    .from('merchant_debt_view')
    .select('*')
    .order('total_debt', { ascending: false })

  const rows = [
    createHeaderRow(['التاجر', 'الهاتف', 'إجمالي الفواتير', 'المدفوع', 'المديونية']),
    ...(debts?.map((debt) =>
      createDataRow([
        debt.merchant_name,
        debt.merchant_phone || '-',
        debt.total_invoices.toString(),
        debt.total_paid.toString(),
        debt.total_debt.toString(),
      ])
    ) || []),
  ]

  return new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'تقرير المديونية',
                bold: true,
                size: 32,
                font: 'Cairo',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`,
                font: 'Cairo',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
          }),
          new Table({
            rows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      },
    ],
  })
}

async function generateProfitLossReport(): Promise<Document> {
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

  const rows = [
    createDataRow(['إجمالي المبيعات', totalSales.toLocaleString()]),
    createDataRow(['تكلفة البضاعة المباعة', totalCost.toLocaleString()]),
    createDataRow(['إجمالي الربح', grossProfit.toLocaleString()]),
    createDataRow(['قيمة الفاقد', totalLosses.toLocaleString()]),
    createDataRow(['صافي الربح', netProfit.toLocaleString()]),
  ]

  return new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'تقرير الأرباح والخسائر',
                bold: true,
                size: 32,
                font: 'Cairo',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`,
                font: 'Cairo',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
          }),
          new Table({
            rows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      },
    ],
  })
}
