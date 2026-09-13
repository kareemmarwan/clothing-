'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import ProductForm from './ProductForm'
import { Product } from '@/lib/types'

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const queryClient = useQueryClient()
  const { productFilter, setProductFilter } = useAppStore()

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', productFilter],
    queryFn: async () => {
      let query = supabase.from('product_stock_view').select('*')

      if (productFilter.category) {
        query = query.eq('category', productFilter.category)
      }

      if (productFilter.search) {
        query = query.or(
          `name.ilike.%${productFilter.search}%,type.ilike.%${productFilter.search}%,color.ilike.%${productFilter.search}%`
        )
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data as Product[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">الأصناف</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          إضافة صنف جديد
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="بحث بالاسم أو النوع أو اللون..."
            value={productFilter.search}
            onChange={(e) => setProductFilter({ search: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={productFilter.category}
            onChange={(e) => setProductFilter({ category: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع الفئات</option>
            <option value="رجالي">رجالي</option>
            <option value="حريمي">حريمي</option>
          </select>
        </div>
      </Card>

      {/* Products Table */}
      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : products && products.length > 0 ? (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold">الاسم</th>
                  <th className="text-right py-3 px-4 font-semibold">الفئة</th>
                  <th className="text-right py-3 px-4 font-semibold">النوع</th>
                  <th className="text-right py-3 px-4 font-semibold">المقاس</th>
                  <th className="text-right py-3 px-4 font-semibold">اللون</th>
                  <th className="text-right py-3 px-4 font-semibold">سعر التكلفة</th>
                  <th className="text-right py-3 px-4 font-semibold">سعر البيع</th>
                  <th className="text-right py-3 px-4 font-semibold">المستورد</th>
                  <th className="text-right py-3 px-4 font-semibold">المباع</th>
                  <th className="text-right py-3 px-4 font-semibold">الفاقد</th>
                  <th className="text-right py-3 px-4 font-semibold">المتبقي</th>
                  <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{product.name}</td>
                    <td className="py-3 px-4">{product.category}</td>
                    <td className="py-3 px-4">{product.type}</td>
                    <td className="py-3 px-4">{product.size}</td>
                    <td className="py-3 px-4">{product.color}</td>
                    <td className="py-3 px-4">{product.cost_price}</td>
                    <td className="py-3 px-4">{product.sale_price}</td>
                    <td className="py-3 px-4">{product.quantity_imported}</td>
                    <td className="py-3 px-4">{product.total_sold || 0}</td>
                    <td className="py-3 px-4">{product.total_lost || 0}</td>
                    <td className="py-3 px-4 font-semibold">{product.remaining || 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          تعديل
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {products.map((product) => (
              <Card key={product.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category} - {product.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                      تعديل
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(product.id)}>
                      حذف
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">المقاس:</span> {product.size}</div>
                  <div><span className="text-gray-500">اللون:</span> {product.color}</div>
                  <div><span className="text-gray-500">سعر التكلفة:</span> {product.cost_price}</div>
                  <div><span className="text-gray-500">سعر البيع:</span> {product.sale_price}</div>
                  <div><span className="text-gray-500">المستورد:</span> {product.quantity_imported}</div>
                  <div><span className="text-gray-500">المتبقي:</span> {product.remaining || 0}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد أصناف. قم بإضافة صنف جديد.
          </div>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'تعديل الصنف' : 'إضافة صنف جديد'}
      >
        <ProductForm
          product={editingProduct}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  )
}
