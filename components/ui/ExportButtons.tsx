'use client'

import Button from './Button'

interface ExportButtonsProps {
  reportType: 'invoices' | 'inventory' | 'debts' | 'profit-loss'
}

export default function ExportButtons({ reportType }: ExportButtonsProps) {
  const handleExport = async (format: 'excel' | 'word') => {
    try {
      const response = await fetch(`/api/export/${format}?type=${reportType}`)
      
      if (!response.ok) {
        throw new Error('فشل التصدير')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}-report.${format === 'excel' ? 'xlsx' : 'docx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('حدث خطأ أثناء التصدير')
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={() => handleExport('excel')}>
        تصدير Excel
      </Button>
      <Button variant="secondary" size="sm" onClick={() => handleExport('word')}>
        تصدير Word
      </Button>
    </div>
  )
}
