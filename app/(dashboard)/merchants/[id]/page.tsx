'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function MerchantDetailsPage() {
  const params = useParams()
  const merchantId = params.id as string

  const { data: merchant, isLoading } = useQuery({
    queryKey: ['merchant', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', merchantId)
        .single()

      if (error) throw error
      return data
    },
  })

  const { data: invoices } = useQuery({
    queryKey: ['merchant-invoices', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const { data: payments } = useQuery({
    queryKey: ['merchant-payments', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, invoices(invoice_number)')
        .eq('merchant_id', merchantId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const { data: debtSummary } = useQuery({
    queryKey: ['merchant-debt', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_debt_view')
        .select('*')
        .eq('merchant_id', merchantId)
        .single()

      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  if (!merchant) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">التاجر غير موجود</p>
        <Link href="/merchants">
          <Button variant="secondary" className="mt-4">
            العودة للتجار
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{merchant.name}</h1>
          <p className="text-gray-500">{merchant.phone || 'لا يوجد هاتف'}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/merchants">
            <Button variant="secondary">العودة</Button>
          </Link>
        </div>
      </div>

      {/* Debt Summary */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">ملخص المديونية</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">إجمالي الفواتير</p>
            <p className="text-2xl font-bold">{debtSummary?.total_invoices || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">المدفوع</p>
            <p className="text-2xl font-bold text-green-600">{debtSummary?.total_paid || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">المتبقي</p>
            <p className={`text-2xl font-bold ${(debtSummary?.total_debt || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {debtSummary?.total_debt || 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Invoices */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-4">الفواتير</h2>
        {invoices && invoices.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3 text-sm font-semibold">رقم الفاتورة</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">التاريخ</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">الإجمالي</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">المدفوع</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">المتبقي</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <Link href={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline">
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="py-2 px-3">{invoice.total_amount}</td>
                      <td className="py-2 px-3">{invoice.paid_amount}</td>
                      <td className="py-2 px-3 font-semibold">{invoice.remaining_amount}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {invoice.status === 'paid'
                            ? 'مدفوعة'
                            : invoice.status === 'partial'
                            ? 'مدفوعة جزئياً'
                            : 'غير مدفوعة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/invoices/${invoice.id}`} className="text-blue-600 font-semibold hover:underline">
                      {invoice.invoice_number}
                    </Link>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invoice.status === 'paid'
                        ? 'مدفوعة'
                        : invoice.status === 'partial'
                        ? 'مدفوعة جزئياً'
                        : 'غير مدفوعة'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">الإجمالي:</span>
                      <span className="font-semibold block">{invoice.total_amount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">المدفوع:</span>
                      <span className="font-semibold block text-green-600">{invoice.paid_amount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">المتبقي:</span>
                      <span className="font-semibold block text-red-600">{invoice.remaining_amount}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">لا توجد فواتير</p>
        )}
      </Card>

      {/* Payments */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">سجل الدفعات</h2>
        {payments && payments.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-3 text-sm font-semibold">التاريخ</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">رقم الفاتورة</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">المبلغ</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">طريقة الدفع</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-sm">
                        {new Date(payment.payment_date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="py-2 px-3">
                        {(payment.invoices as any)?.invoice_number || '-'}
                      </td>
                      <td className="py-2 px-3 font-semibold text-green-600">
                        {payment.amount}
                      </td>
                      <td className="py-2 px-3">{payment.payment_method}</td>
                      <td className="py-2 px-3 text-sm text-gray-500">
                        {payment.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-500">
                        فاتورة: {(payment.invoices as any)?.invoice_number || '-'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.payment_date).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {payment.amount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{payment.payment_method}</span>
                    {payment.notes && <span className="text-gray-500">{payment.notes}</span>}
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">لا توجد دفعات</p>
        )}
      </Card>
    </div>
  )
}
