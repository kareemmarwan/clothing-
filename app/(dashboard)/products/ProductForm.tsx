'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Product } from '@/lib/types'

const productSchema = z.object({
  name: z.string().min(1, 'اسم الصنف مطلوب'),
  category: z.enum(['رجالي', 'حريمي'], { required_error: 'الفئة مطلوبة' }),
  type: z.string().min(1, 'نوع القطعة مطلوب'),
  size: z.string().min(1, 'المقاس مطلوب'),
  color: z.string().min(1, 'اللون مطلوب'),
  cost_price: z.coerce.number().min(0, 'سعر التكلفة يجب أن يكون أكبر من أو يساوي صفر'),
  sale_price: z.coerce.number().min(0, 'سعر البيع يجب أن يكون أكبر من أو يساوي صفر'),
  quantity_imported: z.coerce.number().min(0, 'الكمية المستوردة يجب أن تكون أكبر من أو تساوي صفر'),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product | null
  onClose: () => void
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          category: product.category as 'رجالي' | 'حريمي',
          type: product.type,
          size: product.size,
          color: product.color,
          cost_price: product.cost_price,
          sale_price: product.sale_price,
          quantity_imported: product.quantity_imported,
        }
      : {
          name: '',
          category: undefined,
          type: '',
          size: '',
          color: '',
          cost_price: 0,
          sale_price: 0,
          quantity_imported: 0,
        },
  })

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: data.name,
            category: data.category,
            type: data.type,
            size: data.size,
            color: data.color,
            cost_price: data.cost_price,
            sale_price: data.sale_price,
          })
          .eq('id', product.id)

        if (error) throw error
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert({
            name: data.name,
            category: data.category,
            type: data.type,
            size: data.size,
            color: data.color,
            cost_price: data.cost_price,
            sale_price: data.sale_price,
            quantity_imported: data.quantity_imported,
          })
          .select()
          .single()

        if (error) throw error

        // Create inventory movement for import
        if (data.quantity_imported > 0 && newProduct) {
          const { error: movementError } = await supabase
            .from('inventory_movements')
            .insert({
              product_id: newProduct.id,
              movement_type: 'import',
              quantity: data.quantity_imported,
              notes: 'استيراد أولي',
            })

          if (movementError) throw movementError
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
  })

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="اسم الصنف"
        {...register('name')}
        error={errors.name?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الفئة
          </label>
          <select
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">اختر الفئة</option>
            <option value="رجالي">رجالي</option>
            <option value="حريمي">حريمي</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <Input
          label="نوع القطعة"
          {...register('type')}
          error={errors.type?.message}
          placeholder="قميص، بنطال، عباية..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="المقاس"
          {...register('size')}
          error={errors.size?.message}
        />

        <Input
          label="اللون"
          {...register('color')}
          error={errors.color?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="سعر التكلفة"
          type="number"
          {...register('cost_price')}
          error={errors.cost_price?.message}
        />

        <Input
          label="سعر البيع"
          type="number"
          {...register('sale_price')}
          error={errors.sale_price?.message}
        />
      </div>

      {!product && (
        <Input
          label="الكمية المستوردة"
          type="number"
          {...register('quantity_imported')}
          error={errors.quantity_imported?.message}
        />
      )}

      {mutation.isError && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          حدث خطأ أثناء الحفظ
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          إلغاء
        </Button>
        <Button type="submit" isLoading={mutation.isPending}>
          {product ? 'تحديث' : 'إضافة'}
        </Button>
      </div>
    </form>
  )
}
