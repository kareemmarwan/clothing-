export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          category: string
          type: string
          size: string
          color: string
          cost_price: number
          sale_price: number
          quantity_imported: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          type: string
          size: string
          color: string
          cost_price: number
          sale_price: number
          quantity_imported?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          type?: string
          size?: string
          color?: string
          cost_price?: number
          sale_price?: number
          quantity_imported?: number
          created_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          product_id: string
          movement_type: 'import' | 'sale' | 'loss' | 'return'
          quantity: number
          reference_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          movement_type: 'import' | 'sale' | 'loss' | 'return'
          quantity: number
          reference_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          movement_type?: 'import' | 'sale' | 'loss' | 'return'
          quantity?: number
          reference_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      merchants: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          merchant_id: string
          invoice_number: string
          total_amount: number
          paid_amount: number
          remaining_amount: number
          status: 'paid' | 'partial' | 'unpaid'
          created_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          invoice_number: string
          total_amount?: number
          paid_amount?: number
          remaining_amount?: number
          status?: 'paid' | 'partial' | 'unpaid'
          created_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          invoice_number?: string
          total_amount?: number
          paid_amount?: number
          remaining_amount?: number
          status?: 'paid' | 'partial' | 'unpaid'
          created_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_id: string
          quantity: number
          unit_price: number
          line_total: number
        }
        Insert: {
          id?: string
          invoice_id: string
          product_id: string
          quantity: number
          unit_price: number
          line_total: number
        }
        Update: {
          id?: string
          invoice_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          line_total?: number
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          merchant_id: string
          amount: number
          payment_method: string
          payment_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          merchant_id: string
          amount: number
          payment_method?: string
          payment_date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          merchant_id?: string
          amount?: number
          payment_method?: string
          payment_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      losses: {
        Row: {
          id: string
          product_id: string
          quantity: number
          reason: string
          cost_impact: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          reason: string
          cost_impact: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          reason?: string
          cost_impact?: number
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      product_stock_view: {
        Row: {
          id: string
          name: string
          category: string
          type: string
          size: string
          color: string
          cost_price: number
          sale_price: number
          quantity_imported: number
          created_at: string
          total_imported: number
          total_sold: number
          total_lost: number
          total_returned: number
          remaining: number
        }
      }
      merchant_debt_view: {
        Row: {
          merchant_id: string
          merchant_name: string
          merchant_phone: string | null
          total_invoices: number
          total_paid: number
          total_debt: number
        }
      }
      dashboard_stats_view: {
        Row: {
          total_sales: number
          invoice_count: number
          net_profit: number
          loss_value: number
        }
      }
      top_debtors_view: {
        Row: {
          merchant_id: string
          merchant_name: string
          total_debt: number
        }
      }
      top_products_view: {
        Row: {
          product_id: string
          product_name: string
          total_sold: number
        }
      }
      sales_over_time_view: {
        Row: {
          sale_date: string
          daily_amount: number
        }
      }
      sales_by_category_view: {
        Row: {
          category: string
          category_amount: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      movement_type: 'import' | 'sale' | 'loss' | 'return'
      invoice_status: 'paid' | 'partial' | 'unpaid'
    }
  }
}
