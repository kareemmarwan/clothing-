import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import ToastContainer from '@/components/ui/Toast'

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
})

export const metadata: Metadata = {
  title: 'نظام محاسبة تاجر ملابس',
  description: 'نظام محاسبة داخلي لتاجر ملابس',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-cairo bg-gray-50 text-gray-900">
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
