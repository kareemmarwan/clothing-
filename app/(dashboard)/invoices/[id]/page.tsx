'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function InvoiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const invoiceId = params.id as string

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('نقدي')
  const [paymentNotes, setPaymentNotes] = useState('')

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, merchants(name, phone)')
        .eq('id', invoiceId)
        .single()

      if (error) throw error
      return data
    },
  })

  const { data: items } = useQuery({
    queryKey: ['invoice-items', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*, products(name, size, color)')
        .eq('invoice_id', invoiceId)

      if (error) throw error
      return data
    },
  })

  const { data: payments } = useQuery({
    queryKey: ['invoice-payments', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      if (paymentAmount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر')
      if (paymentAmount > (invoice?.remaining_amount || 0)) {
        throw new Error('المبلغ أكبر من المتبقي')
      }

      const { error } = await supabase.from('payments').insert({
        invoice_id: invoiceId,
        merchant_id: invoice?.merchant_id,
        amount: paymentAmount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString().split('T')[0],
        notes: paymentNotes || null,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoice-payments', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setIsPaymentModalOpen(false)
      setPaymentAmount(0)
      setPaymentNotes('')
    },
  })

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">الفاتورة غير موجودة</p>
        <Link href="/invoices">
          <Button variant="secondary" className="mt-4">
            العودة للفواتير
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header - Hidden on print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">فاتورة {invoice.invoice_number}</h1>
          <p className="text-gray-500">
            {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/invoices">
            <Button variant="secondary">العودة</Button>
          </Link>
          <Button variant="secondary" onClick={handlePrint}>
            طباعة
          </Button>
          {invoice.status !== 'paid' && (
            <Button onClick={() => setIsPaymentModalOpen(true)}>
              إضافة دفعة
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Content - Printable */}
      <Card className="mb-6">
        <div className="text-center mb-6 print:mb-8">
          <h2 className="text-2xl font-bold">فاتورة بيع</h2>
          <p className="text-gray-500">نظام محاسبة تاجر ملابس</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 print:mb-8">
          <div>
            <p className="text-sm text-gray-500">رقم الفاتورة</p>
            <p className="font-semibold">{invoice.invoice_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">التاريخ</p>
            <p className="font-semibold">
              {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">التاجر</p>
            <p className="font-semibold">{(invoice.merchants as any)?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">الهاتف</p>
            <p className="font-semibold">{(invoice.merchants as any)?.phone || '-'}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-6 print:mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-right py-3 px-4 border font-semibold">#</th>
                <th className="text-right py-3 px-4 border font-semibold">الصنف</th>
                <th className="text-right py-3 px-4 border font-semibold">المقاس</th>
                <th className="text-right py-3 px-4 border font-semibold">اللون</th>
                <th className="text-right py-3 px-4 border font-semibold">الكمية</th>
                <th className="text-right py-3 px-4 border font-semibold">سعر الوحدة</th>
                <th className="text-right py-3 px-4 border font-semibold">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border">{index + 1}</td>
                  <td className="py-3 px-4 border">{(item.products as any)?.name}</td>
                  <td className="py-3 px-4 border">{(item.products as any)?.size}</td>
                  <td className="py-3 px-4 border">{(item.products as any)?.color}</td>
                  <td className="py-3 px-4 border">{item.quantity}</td>
                  <td className="py-3 px-4 border">{item.unit_price}</td>
                  <td className="py-3 px-4 border font-semibold">{item.line_total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={6} className="py-3 px-4 border text-left">
                  الإجمالي
                </td>
                <td className="py-3 px-4 border text-lg">{invoice.total_amount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">إجمالي الفاتورة</p>
            <p className="text-xl font-bold">{invoice.total_amount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">المدفوع</p>
            <p className="text-xl font-bold text-green-600">{invoice.paid_amount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">المتبقي</p>
            <p
              className={`text-xl font-bold ${
                invoice.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {invoice.remaining_amount}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 text-center">
          <span
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              invoice.status === 'paid'
                ? 'bg-green-100 text-green-800'
                : invoice.status === 'partial'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {invoice.status === 'paid'
              ? 'مدفوعة بالكامل'
              : invoice.status === 'partial'
              ? 'مدفوعة جزئياً'
              : 'غير مدفوعة'}
          </span>
        </div>
      </Card>

      {/* Payments History - Hidden on print */}
      <Card className="print:hidden">
        <h2 className="text-lg font-semibold mb-4">سجل الدفعات</h2>
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 px-3 text-sm font-semibold">التاريخ</th>
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
        ) : (
          <p className="text-gray-500 text-center py-4">لا توجد دفعات مسجلة</p>
        )}
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="إضافة دفعة"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">المتبقي من الفاتورة</p>
            <p className="text-2xl font-bold text-red-600">{invoice.remaining_amount}</p>
          </div>

          <Input
            label="المبلغ"
            type="number"
            min="1"
            max={invoice.remaining_amount}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              طريقة الدفع
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="نقدي">نقدي</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
              <option value="شيك">شيك</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {addPaymentMutation.isError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {(addPaymentMutation.error as Error).message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={() => addPaymentMutation.mutate()}
              isLoading={addPaymentMutation.isPending}
              disabled={paymentAmount <= 0 || paymentAmount > invoice.remaining_amount}
            >
              إضافة الدفعة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
