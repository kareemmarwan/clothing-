'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import MerchantForm from './MerchantForm'
import { Merchant } from '@/lib/types'

export default function MerchantsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null)
  const queryClient = useQueryClient()
  const { merchantFilter, setMerchantFilter } = useAppStore()

  const { data: merchants, isLoading } = useQuery({
    queryKey: ['merchants', merchantFilter],
    queryFn: async () => {
      let query = supabase.from('merchant_debt_view').select('*')

      if (merchantFilter.search) {
        query = query.or(
          `merchant_name.ilike.%${merchantFilter.search}%,merchant_phone.ilike.%${merchantFilter.search}%`
        )
      }

      const { data, error } = await query.order('total_debt', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('merchants').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
    },
  })

  const handleEdit = (merchant: any) => {
    setEditingMerchant({
      id: merchant.merchant_id,
      name: merchant.merchant_name,
      phone: merchant.merchant_phone,
      created_at: '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التاجر؟ سيتم حذف جميع فواتيره ودفعاته.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingMerchant(null)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">التجار</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          إضافة تاجر جديد
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <input
          type="text"
          placeholder="بحث بالاسم أو رقم الهاتف..."
          value={merchantFilter.search}
          onChange={(e) => setMerchantFilter({ search: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </Card>

      {/* Merchants List */}
      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : merchants && merchants.length > 0 ? (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold">الاسم</th>
                  <th className="text-right py-3 px-4 font-semibold">الهاتف</th>
                  <th className="text-right py-3 px-4 font-semibold">إجمالي الفواتير</th>
                  <th className="text-right py-3 px-4 font-semibold">المدفوع</th>
                  <th className="text-right py-3 px-4 font-semibold">المديونية</th>
                  <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant.merchant_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/merchants/${merchant.merchant_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {merchant.merchant_name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{merchant.merchant_phone || '-'}</td>
                    <td className="py-3 px-4">{merchant.total_invoices}</td>
                    <td className="py-3 px-4">{merchant.total_paid}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          merchant.total_debt > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {merchant.total_debt}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link href={`/merchants/${merchant.merchant_id}`}>
                          <Button variant="ghost" size="sm">
                            تفاصيل
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(merchant)}
                        >
                          تعديل
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(merchant.merchant_id)}
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
            {merchants.map((merchant) => (
              <Card key={merchant.merchant_id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Link
                      href={`/merchants/${merchant.merchant_id}`}
                      className="text-lg font-semibold text-blue-600 hover:underline"
                    >
                      {merchant.merchant_name}
                    </Link>
                    <p className="text-sm text-gray-500">{merchant.merchant_phone || '-'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(merchant)}>
                      تعديل
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(merchant.merchant_id)}>
                      حذف
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">الفواتير:</span>
                    <span className="font-semibold block">{merchant.total_invoices}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">المدفوع:</span>
                    <span className="font-semibold block">{merchant.total_paid}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">المديونية:</span>
                    <span className={`font-semibold block ${merchant.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {merchant.total_debt}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا يوجد تجار. قم بإضافة تاجر جديد.
          </div>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMerchant ? 'تعديل التاجر' : 'إضافة تاجر جديد'}
      >
        <MerchantForm
          merchant={editingMerchant}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  )
}
