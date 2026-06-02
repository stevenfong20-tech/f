import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ImagePlus, Camera, Loader2 } from 'lucide-react';

export default function ProductFormModal({ product, onClose }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name_zh: product?.name_zh || '',
    name_en: product?.name_en || '',
    category_zh: product?.category_zh || '',
    category_en: product?.category_en || '',
    unit_price: product?.unit_price || '',
    unit_zh: product?.unit_zh || '',
    unit_en: product?.unit_en || '',
    description_zh: product?.description_zh || '',
    description_en: product?.description_en || '',
    min_order_qty: product?.min_order_qty || 1,
    image_url: product?.image_url || '',
    is_active: product?.is_active !== false,
  });

  const mutation = useMutation({
    mutationFn: (data) => product
      ? base44.entities.Product.update(product.id, data)
      : base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('saveSuccess'));
      onClose();
    },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const galleryRef = useRef();
  const cameraRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('image_url', file_url);
    setUploading(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? t('editProduct') : t('addProduct')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">商品名稱（中文）</Label>
              <Input value={form.name_zh} onChange={e => set('name_zh', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Product Name (EN)</Label>
              <Input value={form.name_en} onChange={e => set('name_en', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">分類（中文）</Label>
              <Input value={form.category_zh} onChange={e => set('category_zh', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Category (EN)</Label>
              <Input value={form.category_en} onChange={e => set('category_en', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">{t('unitPrice')} (NT$)</Label>
              <Input type="number" value={form.unit_price} onChange={e => set('unit_price', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">單位（中）</Label>
              <Input value={form.unit_zh} onChange={e => set('unit_zh', e.target.value)} placeholder="箱" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Unit (EN)</Label>
              <Input value={form.unit_en} onChange={e => set('unit_en', e.target.value)} placeholder="box" />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t('minQty')}</Label>
            <Input type="number" value={form.min_order_qty} onChange={e => set('min_order_qty', parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">商品圖片 / Product Image</Label>
            <div className="flex gap-2 mt-1">
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e.target.files[0])} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileUpload(e.target.files[0])} />
              <Button type="button" variant="outline" className="flex-1" onClick={() => galleryRef.current.click()} disabled={uploading}>
                <ImagePlus size={15} className="mr-1.5" /> 從相簿選取 / Gallery
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => cameraRef.current.click()} disabled={uploading}>
                <Camera size={15} className="mr-1.5" /> 拍照 / Camera
              </Button>
            </div>
            {uploading && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> 上傳中...</p>}
            {form.image_url && !uploading && (
              <img src={form.image_url} alt="preview" className="mt-2 h-24 w-24 object-cover rounded-lg border border-border" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
            <Label>{form.is_active ? t('productActive') : t('productInactive')}</Label>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.name_zh}>
            {mutation.isPending ? t('loading') : t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
