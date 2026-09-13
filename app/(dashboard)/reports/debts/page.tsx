'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'

export default function DebtReportPage() {
  const { data: debts, isLoading } = useQuery({
    queryKey: ['debt-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_debt_view')
        .select('*')
        .order('total_debt', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const totalDebt = debts?.reduce((sum, d) => sum + d.total_debt, 0) || 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">تقرير المديونية</h1>

      {/* Summary Card */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">إجمالي المديونية</p>
            <p className="text-3xl font-bold text-red-600">{totalDebt}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">عدد التجار المديونين</p>
            <p className="text-3xl font-bold text-blue-600">
              {debts?.filter((d) => d.total_debt > 0).length || 0}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">إجمالي المدفوعات</p>
            <p className="text-3xl font-bold text-green-600">
              {debts?.reduce((sum, d) => sum + d.total_paid, 0) || 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Debts Table */}
      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : debts && debts.length > 0 ? (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold">#</th>
                  <th className="text-right py-3 px-4 font-semibold">التاجر</th>
                  <th className="text-right py-3 px-4 font-semibold">الهاتف</th>
                  <th className="text-right py-3 px-4 font-semibold">إجمالي الفواتير</th>
                  <th className="text-right py-3 px-4 font-semibold">المدفوع</th>
                  <th className="text-right py-3 px-4 font-semibold">المديونية</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt, index) => (
                  <tr key={debt.merchant_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{debt.merchant_name}</td>
                    <td className="py-3 px-4">{debt.merchant_phone || '-'}</td>
                    <td className="py-3 px-4">{debt.total_invoices}</td>
                    <td className="py-3 px-4 text-green-600">{debt.total_paid}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          debt.total_debt > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {debt.total_debt}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {debts.map((debt, index) => (
              <Card key={debt.merchant_id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                    <h3 className="font-semibold text-lg">{debt.merchant_name}</h3>
                    <p className="text-sm text-gray-500">{debt.merchant_phone || '-'}</p>
                  </div>
                  <span
                    className={`text-xl font-bold ${
                      debt.total_debt > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {debt.total_debt}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">إجمالي الفواتير:</span>
                    <span className="font-semibold block">{debt.total_invoices}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">المدفوع:</span>
                    <span className="font-semibold block text-green-600">{debt.total_paid}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات مديونية
          </div>
        </Card>
      )}
    </div>
  )
}
