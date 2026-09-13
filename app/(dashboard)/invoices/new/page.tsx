'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

interface InvoiceItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  max_quantity: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [merchantId, setMerchantId] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)

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

  const { data: products } = useQuery({
    queryKey: ['products-available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_stock_view')
        .select('id, name, sale_price, remaining')
        .gt('remaining', 0)
        .order('name')

      if (error) throw error
      return data
    },
  })

  const addItem = () => {
    if (!selectedProduct || quantity <= 0) return

    const product = products?.find((p) => p.id === selectedProduct)
    if (!product) return

    if (quantity > product.remaining) {
      alert(`الكمية المتاحة: ${product.remaining}`)
      return
    }

    const existingItem = items.find((item) => item.product_id === selectedProduct)
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > product.remaining) {
        alert(`الكمية المتاحة: ${product.remaining}`)
        return
      }
      setItems(
        items.map((item) =>
          item.product_id === selectedProduct
            ? {
                ...item,
                quantity: newQuantity,
                line_total: newQuantity * item.unit_price,
              }
            : item
        )
      )
    } else {
      setItems([
        ...items,
        {
          product_id: selectedProduct,
          product_name: product.name,
          quantity,
          unit_price: unitPrice || product.sale_price,
          line_total: quantity * (unitPrice || product.sale_price),
          max_quantity: product.remaining,
        },
      ])
    }

    setSelectedProduct('')
    setQuantity(1)
    setUnitPrice(0)
  }

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.product_id !== productId))
  }

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    const item = items.find((i) => i.product_id === productId)
    if (!item) return

    if (newQuantity > item.max_quantity) {
      alert(`الكمية المتاحة: ${item.max_quantity}`)
      return
    }

    if (newQuantity <= 0) {
      removeItem(productId)
      return
    }

    setItems(
      items.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: newQuantity, line_total: newQuantity * i.unit_price }
          : i
      )
    )
  }

  const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0)

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!merchantId) throw new Error('يجب اختيار تاجر')
      if (items.length === 0) throw new Error('يجب إضافة صنف واحد على الأقل')

      // Generate invoice number
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })

      const invoiceNumber = `INV-${String((count || 0) + 1).padStart(6, '0')}`

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          merchant_id: merchantId,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          remaining_amount: totalAmount,
          status: 'unpaid',
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // Create invoice items
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsError) throw itemsError

      // Create inventory movements for each item
      const movements = items.map((item) => ({
        product_id: item.product_id,
        movement_type: 'sale' as const,
        quantity: item.quantity,
        reference_id: invoice.id,
        notes: `فاتورة رقم ${invoiceNumber}`,
      }))

      const { error: movementsError } = await supabase
        .from('inventory_movements')
        .insert(movements)

      if (movementsError) throw movementsError

      return invoice
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      router.push(`/invoices/${invoice.id}`)
    },
  })

  const handleSubmit = () => {
    if (confirm('هل أنت متأكد من إنشاء هذه الفاتورة؟')) {
      createInvoiceMutation.mutate()
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">إنشاء فاتورة جديدة</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Merchant Selection */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">اختيار التاجر</h2>
            <select
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">اختر التاجر</option>
              {merchants?.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </Card>

          {/* Add Items */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">إضافة أصناف</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الصنف
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value)
                    const product = products?.find((p) => p.id === e.target.value)
                    if (product) setUnitPrice(product.sale_price)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر الصنف</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (متاح: {product.remaining})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="الكمية"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div>
                <Input
                  label="سعر الوحدة"
                  type="number"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                />
              </div>
            </div>

            <Button onClick={addItem} disabled={!selectedProduct || quantity <= 0}>
              إضافة الصنف
            </Button>
          </Card>

          {/* Items List */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">الأصناف المضافة</h2>
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        {item.unit_price} × {item.quantity} = {item.line_total}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateItemQuantity(item.product_id, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateItemQuantity(item.product_id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لم تتم إضافة أي أصناف بعد</p>
            )}
          </Card>
        </div>

        {/* Invoice Summary */}
        <div>
          <Card className="sticky top-6">
            <h2 className="text-lg font-semibold mb-4">ملخص الفاتورة</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">عدد الأصناف:</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الإجمالي:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {totalAmount}
                </span>
              </div>
            </div>

            {createInvoiceMutation.isError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                {(createInvoiceMutation.error as Error).message}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              isLoading={createInvoiceMutation.isPending}
              disabled={!merchantId || items.length === 0}
            >
              إنشاء الفاتورة
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
