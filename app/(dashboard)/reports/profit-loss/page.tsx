'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'

export default function ProfitLossReportPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: profitData, isLoading } = useQuery({
    queryKey: ['profit-loss', dateFrom, dateTo],
    queryFn: async () => {
      // Get sales data
      let salesQuery = supabase
        .from('invoice_items')
        .select('quantity, unit_price, line_total, products(cost_price)')

      if (dateFrom) {
        salesQuery = salesQuery.gte('created_at', dateFrom)
      }
      if (dateTo) {
        salesQuery = salesQuery.lte('created_at', dateTo + 'T23:59:59')
      }

      const { data: salesItems, error: salesError } = await salesQuery
      if (salesError) throw salesError

      // Calculate profit
      let totalSales = 0
      let totalCost = 0

      salesItems?.forEach((item) => {
        totalSales += item.line_total
        totalCost += (item.products as any)?.cost_price * item.quantity || 0
      })

      const grossProfit = totalSales - totalCost

      // Get losses
      let lossesQuery = supabase
        .from('losses')
        .select('cost_impact')

      if (dateFrom) {
        lossesQuery = lossesQuery.gte('created_at', dateFrom)
      }
      if (dateTo) {
        lossesQuery = lossesQuery.lte('created_at', dateTo + 'T23:59:59')
      }

      const { data: losses, error: lossesError } = await lossesQuery
      if (lossesError) throw lossesError

      const totalLosses = losses?.reduce((sum, l) => sum + l.cost_impact, 0) || 0

      const netProfit = grossProfit - totalLosses

      return {
        totalSales,
        totalCost,
        grossProfit,
        totalLosses,
        netProfit,
      }
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">تقرير الأرباح والخسائر</h1>

      {/* Date Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              من تاريخ
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : profitData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">إجمالي المبيعات</p>
              <p className="text-3xl font-bold text-blue-600">
                {profitData.totalSales.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">تكلفة البضاعة المباعة</p>
              <p className="text-3xl font-bold text-orange-600">
                {profitData.totalCost.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">إجمالي الربح</p>
              <p className="text-3xl font-bold text-green-600">
                {profitData.grossProfit.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">قيمة الفاقد</p>
              <p className="text-3xl font-bold text-red-600">
                {profitData.totalLosses.toLocaleString()}
              </p>
            </div>
          </Card>

          <Card className="sm:col-span-2">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">صافي الربح</p>
              <p
                className={`text-4xl font-bold ${
                  profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {profitData.netProfit.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات
          </div>
        </Card>
      )}
    </div>
  )
}
