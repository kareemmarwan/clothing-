'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function LossesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('تالف')
  const [notes, setNotes] = useState('')
  const [filterReason, setFilterReason] = useState('')

  const { data: losses, isLoading } = useQuery({
    queryKey: ['losses', filterReason],
    queryFn: async () => {
      let query = supabase
        .from('losses')
        .select('*, products(name, cost_price)')
        .order('created_at', { ascending: false })

      if (filterReason) {
        query = query.eq('reason', filterReason)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products-available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_stock_view')
        .select('id, name, cost_price, remaining')
        .gt('remaining', 0)
        .order('name')

      if (error) throw error
      return data
    },
  })

  const addLossMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error('يجب اختيار صنف')
      if (quantity <= 0) throw new Error('الكمية يجب أن تكون أكبر من صفر')

      const product = products?.find((p) => p.id === selectedProduct)
      if (!product) throw new Error('الصنف غير موجود')

      if (quantity > product.remaining) {
        throw new Error(`الكمية المتاحة: ${product.remaining}`)
      }

      const costImpact = quantity * product.cost_price

      const { error } = await supabase.from('losses').insert({
        product_id: selectedProduct,
        quantity,
        reason,
        cost_impact: costImpact,
        notes: notes || null,
      })

      if (error) throw error

      // Create inventory movement
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: selectedProduct,
          movement_type: 'loss',
          quantity,
          notes: `فاقد - ${reason}: ${notes || ''}`,
        })

      if (movementError) throw movementError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['losses'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsModalOpen(false)
      resetForm()
    },
  })

  const resetForm = () => {
    setSelectedProduct('')
    setQuantity(1)
    setReason('تالف')
    setNotes('')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const totalLossValue = losses?.reduce((sum, l) => sum + l.cost_impact, 0) || 0
  const totalLossQuantity = losses?.reduce((sum, l) => sum + l.quantity, 0) || 0

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">الفاقد</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          تسجيل فاقد جديد
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">إجمالي قيمة الفاقد</p>
            <p className="text-3xl font-bold text-red-600">{totalLossValue.toLocaleString()}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">إجمالي الكمية الفاقدة</p>
            <p className="text-3xl font-bold text-orange-600">{totalLossQuantity}</p>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <select
          value={filterReason}
          onChange={(e) => setFilterReason(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">جميع الأسباب</option>
          <option value="تالف">تالف</option>
          <option value="عيب">عيب تصنيع</option>
          <option value="مفقود">مفقود</option>
        </select>
      </Card>

      {/* Losses Table */}
      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : losses && losses.length > 0 ? (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold">الصنف</th>
                  <th className="text-right py-3 px-4 font-semibold">الكمية</th>
                  <th className="text-right py-3 px-4 font-semibold">السبب</th>
                  <th className="text-right py-3 px-4 font-semibold">تكلفة الفاقد</th>
                  <th className="text-right py-3 px-4 font-semibold">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {losses.map((loss) => (
                  <tr key={loss.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(loss.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4">{(loss.products as any)?.name}</td>
                    <td className="py-3 px-4">{loss.quantity}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          loss.reason === 'تالف'
                            ? 'bg-red-100 text-red-800'
                            : loss.reason === 'عيب'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {loss.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-red-600">
                      {loss.cost_impact}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {loss.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {losses.map((loss) => (
              <Card key={loss.id}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{(loss.products as any)?.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(loss.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      loss.reason === 'تالف'
                        ? 'bg-red-100 text-red-800'
                        : loss.reason === 'عيب'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {loss.reason}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">الكمية:</span>
                    <span className="font-semibold block">{loss.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">تكلفة الفاقد:</span>
                    <span className="font-semibold block text-red-600">{loss.cost_impact}</span>
                  </div>
                </div>
                {loss.notes && (
                  <p className="text-sm text-gray-500 mt-2">{loss.notes}</p>
                )}
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد سجلات فاقد
          </div>
        </Card>
      )}

      {/* Add Loss Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="تسجيل فاقد جديد"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الصنف
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">اختر الصنف</option>
              {products?.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (متاح: {product.remaining})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="الكمية"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              السبب
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="تالف">تالف</option>
              <option value="عيب">عيب تصنيع</option>
              <option value="مفقود">مفقود</option>
            </select>
          </div>

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

          {selectedProduct && quantity > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">تكلفة الفاقد المتوقعة:</p>
              <p className="text-lg font-bold text-red-600">
                {(
                  quantity *
                  (products?.find((p) => p.id === selectedProduct)?.cost_price || 0)
                ).toLocaleString()}
              </p>
            </div>
          )}

          {addLossMutation.isError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {(addLossMutation.error as Error).message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>
              إلغاء
            </Button>
            <Button
              onClick={() => addLossMutation.mutate()}
              isLoading={addLossMutation.isPending}
              disabled={!selectedProduct || quantity <= 0}
            >
              تسجيل الفاقد
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
