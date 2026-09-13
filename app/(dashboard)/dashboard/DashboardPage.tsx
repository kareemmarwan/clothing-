'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const COLORS = ['#3B82F6', '#EC4899']

export default function DashboardPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all')

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', period],
    queryFn: async () => {
      let dateFilter = ''
      const now = new Date()

      switch (period) {
        case 'today':
          dateFilter = now.toISOString().split('T')[0]
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          dateFilter = weekAgo.toISOString()
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          dateFilter = monthAgo.toISOString()
          break
      }

      // Get sales
      let salesQuery = supabase.from('invoices').select('total_amount, paid_amount')
      if (dateFilter && period !== 'all') {
        salesQuery = salesQuery.gte('created_at', dateFilter)
      }
      const { data: sales } = await salesQuery

      const totalSales = sales?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0
      const invoiceCount = sales?.length || 0

      // Get losses
      let lossesQuery = supabase.from('losses').select('cost_impact')
      if (dateFilter && period !== 'all') {
        lossesQuery = lossesQuery.gte('created_at', dateFilter)
      }
      const { data: losses } = await lossesQuery
      const lossValue = losses?.reduce((sum, l) => sum + l.cost_impact, 0) || 0

      // Calculate net profit (simplified)
      const { data: invoiceItems } = await supabase
        .from('invoice_items')
        .select('quantity, line_total, products(cost_price)')

      let totalCost = 0
      invoiceItems?.forEach((item) => {
        totalCost += (item.products as any)?.cost_price * item.quantity || 0
      })

      const netProfit = totalSales - totalCost - lossValue

      return {
        totalSales,
        invoiceCount,
        netProfit,
        lossValue,
      }
    },
  })

  const { data: topDebtors } = useQuery({
    queryKey: ['top-debtors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_debt_view')
        .select('merchant_id, merchant_name, total_debt')
        .gt('total_debt', 0)
        .order('total_debt', { ascending: false })
        .limit(5)

      if (error) throw error
      return data
    },
  })

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('product_id, quantity, products(name)')
        .order('quantity', { ascending: false })

      if (error) throw error

      // Aggregate by product
      const productMap = new Map<string, { name: string; total: number }>()
      data?.forEach((item) => {
        const productId = item.product_id
        const existing = productMap.get(productId)
        if (existing) {
          existing.total += item.quantity
        } else {
          productMap.set(productId, {
            name: (item.products as any)?.name || '',
            total: item.quantity,
          })
        }
      })

      return Array.from(productMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    },
  })

  const { data: salesOverTime } = useQuery({
    queryKey: ['sales-over-time'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('created_at, total_amount')
        .order('created_at')

      if (error) throw error

      // Group by date
      const dateMap = new Map<string, number>()
      data?.forEach((invoice) => {
        const date = new Date(invoice.created_at).toLocaleDateString('ar-SA')
        dateMap.set(date, (dateMap.get(date) || 0) + invoice.total_amount)
      })

      return Array.from(dateMap.entries()).map(([date, amount]) => ({
        date,
        amount,
      }))
    },
  })

  const { data: salesByCategory } = useQuery({
    queryKey: ['sales-by-category'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('line_total, products(category)')

      if (error) throw error

      const categoryMap = new Map<string, number>()
      data?.forEach((item) => {
        const category = (item.products as any)?.category || 'أخرى'
        categoryMap.set(category, (categoryMap.get(category) || 0) + item.line_total)
      })

      return Array.from(categoryMap.entries()).map(([category, amount]) => ({
        category,
        amount,
      }))
    },
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="today">اليوم</option>
          <option value="week">آخر أسبوع</option>
          <option value="month">آخر شهر</option>
          <option value="all">كل الوقت</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">إجمالي المبيعات</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats?.totalSales.toLocaleString() || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">عدد الفواتير</p>
            <p className="text-3xl font-bold text-green-600">
              {stats?.invoiceCount || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">صافي الربح</p>
            <p
              className={`text-3xl font-bold ${
                (stats?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stats?.netProfit.toLocaleString() || 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">قيمة الفاقد</p>
            <p className="text-3xl font-bold text-red-600">
              {stats?.lossValue.toLocaleString() || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Over Time */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">تطور المبيعات</h2>
          {salesOverTime && salesOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
          )}
        </Card>

        {/* Sales By Category */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">توزيع المبيعات حسب الفئة</h2>
          {salesByCategory && salesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد بيانات</div>
          )}
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Debtors */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">أعلى 5 تجار مديونية</h2>
          {topDebtors && topDebtors.length > 0 ? (
            <div className="space-y-3">
              {topDebtors.map((debtor, index) => (
                <div
                  key={debtor.merchant_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{debtor.merchant_name}</span>
                  </div>
                  <span className="font-bold text-red-600">
                    {debtor.total_debt.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد مديونيات</div>
          )}
        </Card>

        {/* Top Products */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">أكثر 5 أصناف مبيعًا</h2>
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <span className="font-bold text-blue-600">{product.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد مبيعات</div>
          )}
        </Card>
      </div>
    </div>
  )
}
