import { create } from 'zustand'

interface AppState {
  // Filters
  productFilter: {
    category: string
    search: string
  }
  merchantFilter: {
    search: string
  }
  invoiceFilter: {
    merchantId: string
    status: string
    dateFrom: string
    dateTo: string
    search: string
  }
  // Actions
  setProductFilter: (filter: Partial<AppState['productFilter']>) => void
  setMerchantFilter: (filter: Partial<AppState['merchantFilter']>) => void
  setInvoiceFilter: (filter: Partial<AppState['invoiceFilter']>) => void
  resetFilters: () => void
}

const initialState = {
  productFilter: {
    category: '',
    search: '',
  },
  merchantFilter: {
    search: '',
  },
  invoiceFilter: {
    merchantId: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  },
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setProductFilter: (filter) =>
    set((state) => ({
      productFilter: { ...state.productFilter, ...filter },
    })),

  setMerchantFilter: (filter) =>
    set((state) => ({
      merchantFilter: { ...state.merchantFilter, ...filter },
    })),

  setInvoiceFilter: (filter) =>
    set((state) => ({
      invoiceFilter: { ...state.invoiceFilter, ...filter },
    })),

  resetFilters: () => set(initialState),
}))
