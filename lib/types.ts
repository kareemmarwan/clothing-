export interface Product {
  id: string
  name: string
  category: 'رجالي' | 'حريمي'
  type: string
  size: string
  color: string
  cost_price: number
  sale_price: number
  quantity_imported: number
  created_at: string
  // Computed fields from view
  total_sold?: number
  total_lost?: number
  remaining?: number
}

export interface InventoryMovement {
  id: string
  product_id: string
  movement_type: 'import' | 'sale' | 'loss' | 'return'
  quantity: number
  reference_id?: string
  notes?: string
  created_at: string
}

export interface Merchant {
  id: string
  name: string
  phone?: string
  address?: string
  notes?: string
  created_at: string
  // Computed
  total_debt?: number
}

export interface Invoice {
  id: string
  merchant_id: string
  invoice_number: string
  total_amount: number
  paid_amount: number
  remaining_amount: number
  status: 'paid' | 'partial' | 'unpaid'
  created_at: string
  // Relations
  merchant?: Merchant
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id: string
  quantity: number
  unit_price: number
  line_total: number
  // Relations
  product?: Product
}

export interface Payment {
  id: string
  invoice_id: string
  merchant_id: string
  amount: number
  payment_method: string
  payment_date: string
  notes?: string
  created_at: string
  // Relations
  invoice?: Invoice
  merchant?: Merchant
}

export interface Loss {
  id: string
  product_id: string
  quantity: number
  reason: 'تالف' | 'عيب' | 'مفقود'
  cost_impact: number
  notes?: string
  created_at: string
  // Relations
  product?: Product
}

// Dashboard types
export interface DashboardStats {
  totalSales: number
  invoiceCount: number
  netProfit: number
  lossValue: number
}

export interface TopDebtor {
  merchant_id: string
  merchant_name: string
  total_debt: number
}

export interface TopProduct {
  product_id: string
  product_name: string
  total_sold: number
}

export interface SalesOverTime {
  date: string
  amount: number
}

export interface SalesByCategory {
  category: string
  amount: number
}
