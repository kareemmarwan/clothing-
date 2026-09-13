'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function InvoicesPage() {
  const queryClient = useQueryClient()
  const { invoiceFilter, setInvoiceFilter } = useAppStore()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', invoiceFilter],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*, merchants(name)')

      if (invoiceFilter.merchantId) {
        query = query.eq('merchant_id', invoiceFilter.merchantId)
      }

      if (invoiceFilter.status) {
        query = query.eq('status', invoiceFilter.status)
      }

      if (invoiceFilter.dateFrom) {
        query = query.gte('created_at', invoiceFilter.dateFrom)
      }

      if (invoiceFilter.dateTo) {
        query = query.lte('created_at', invoiceFilter.dateTo + 'T23:59:59')
      }

      if (invoiceFilter.search) {
        query = query.ilike('invoice_number', `%${invoiceFilter.search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">الفواتير</h1>
        <Link href="/invoices/new">
          <Button>إنشاء فاتورة جديدة</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="بحث برقم الفاتورة..."
            value={invoiceFilter.search}
            onChange={(e) => setInvoiceFilter({ search: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <select
            value={invoiceFilter.merchantId}
            onChange={(e) => setInvoiceFilter({ merchantId: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع التجار</option>
            {merchants?.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.name}
              </option>
            ))}
          </select>

          <select
            value={invoiceFilter.status}
            onChange={(e) => setInvoiceFilter({ status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">جميع الحالات</option>
            <option value="paid">مدفوعة</option>
            <option value="partial">مدفوعة جزئياً</option>
            <option value="unpaid">غير مدفوعة</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={invoiceFilter.dateFrom}
              onChange={(e) => setInvoiceFilter({ dateFrom: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="من تاريخ"
            />
            <input
              type="date"
              value={invoiceFilter.dateTo}
              onChange={(e) => setInvoiceFilter({ dateTo: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="إلى تاريخ"
            />
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : invoices && invoices.length > 0 ? (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold">رقم الفاتورة</th>
                  <th className="text-right py-3 px-4 font-semibold">التاجر</th>
                  <th className="text-right py-3 px-4 font-semibold">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold">الإجمالي</th>
                  <th className="text-right py-3 px-4 font-semibold">المدفوع</th>
                  <th className="text-right py-3 px-4 font-semibold">المتبقي</th>
                  <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                  <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{(invoice.merchants as any)?.name}</td>
                    <td className="py-3 px-4">
                      {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4">{invoice.total_amount}</td>
                    <td className="py-3 px-4">{invoice.paid_amount}</td>
                    <td className="py-3 px-4 font-semibold">{invoice.remaining_amount}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4">
                      <Link href={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm">
                          تفاصيل
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-lg font-semibold text-blue-600 hover:underline"
                    >
                      {invoice.invoice_number}
                    </Link>
                    <p className="text-sm text-gray-500">{(invoice.merchants as any)?.name}</p>
                  </div>
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
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">الإجمالي:</span>
                    <span className="font-semibold block">{invoice.total_amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">المدفوع:</span>
                    <span className="font-semibold block">{invoice.paid_amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">المتبقي:</span>
                    <span className="font-semibold block">{invoice.remaining_amount}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
                  </span>
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button variant="ghost" size="sm">
                      تفاصيل
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد فواتير. قم بإنشاء فاتورة جديدة.
          </div>
        </Card>
      )}
    </div>
  )
}
