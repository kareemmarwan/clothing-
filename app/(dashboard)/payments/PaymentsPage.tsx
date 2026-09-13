'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function PaymentsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMerchant, setSelectedMerchant] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState('')
  const [amount, setAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('نقدي')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*, merchants(name), invoices(invoice_number)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const { data: merchants } = useQuery({
    queryKey: ['merchants-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('id, name')
        .order('name')

      if (error) throw error
      return data
    },
  })

  const { data: unpaidInvoices } = useQuery({
    queryKey: ['unpaid-invoices', selectedMerchant],
    queryFn: async () => {
      if (!selectedMerchant) return []

      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, remaining_amount')
        .eq('merchant_id', selectedMerchant)
        .neq('status', 'paid')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!selectedMerchant,
  })

  const addPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoice) throw new Error('يجب اختيار فاتورة')
      if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر')

      const invoice = unpaidInvoices?.find((i) => i.id === selectedInvoice)
      if (invoice && amount > invoice.remaining_amount) {
        throw new Error('المبلغ أكبر من المتبقي')
      }

      const { error } = await supabase.from('payments').insert({
        invoice_id: selectedInvoice,
        merchant_id: selectedMerchant,
        amount,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        notes: notes || null,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
      setIsModalOpen(false)
      resetForm()
    },
  })

  const resetForm = () => {
    setSelectedMerchant('')
    setSelectedInvoice('')
    setAmount(0)
    setPaymentMethod('نقدي')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setNotes('')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">الدفعات</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          إضافة دفعة جديدة
        </Button>
      </div>

      {/* Payments Table */}
      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : payments && payments.length > 0 ? (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold">التاجر</th>
                  <th className="text-right py-3 px-4 font-semibold">رقم الفاتورة</th>
                  <th className="text-right py-3 px-4 font-semibold">المبلغ</th>
                  <th className="text-right py-3 px-4 font-semibold">طريقة الدفع</th>
                  <th className="text-right py-3 px-4 font-semibold">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(payment.payment_date).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4">{(payment.merchants as any)?.name}</td>
                    <td className="py-3 px-4">
                      {(payment.invoices as any)?.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-green-600">
                      {payment.amount}
                    </td>
                    <td className="py-3 px-4">{payment.payment_method}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {payment.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{(payment.merchants as any)?.name}</p>
                    <p className="text-sm text-gray-500">
                      فاتورة: {(payment.invoices as any)?.invoice_number}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {payment.amount}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{new Date(payment.payment_date).toLocaleDateString('ar-SA')}</span>
                  <span>{payment.payment_method}</span>
                </div>
                {payment.notes && (
                  <p className="text-sm text-gray-500 mt-2">{payment.notes}</p>
                )}
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد دفعات مسجلة. قم بإضافة دفعة جديدة.
          </div>
        </Card>
      )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="إضافة دفعة جديدة"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              التاجر
            </label>
            <select
              value={selectedMerchant}
              onChange={(e) => {
                setSelectedMerchant(e.target.value)
                setSelectedInvoice('')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">اختر التاجر</option>
              {merchants?.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </div>

          {selectedMerchant && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الفاتورة
              </label>
              <select
                value={selectedInvoice}
                onChange={(e) => {
                  setSelectedInvoice(e.target.value)
                  const invoice = unpaidInvoices?.find((i) => i.id === e.target.value)
                  if (invoice) setAmount(invoice.remaining_amount)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">اختر الفاتورة</option>
                {unpaidInvoices?.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} (متبقي: {invoice.remaining_amount})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="المبلغ"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
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

          <Input
            label="التاريخ"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            <Button variant="secondary" onClick={handleCloseModal}>
              إلغاء
            </Button>
            <Button
              onClick={() => addPaymentMutation.mutate()}
              isLoading={addPaymentMutation.isPending}
              disabled={!selectedInvoice || amount <= 0}
            >
              إضافة الدفعة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
