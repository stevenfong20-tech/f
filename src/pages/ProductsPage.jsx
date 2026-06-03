import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Plus, Pencil, Trash2, Search, Package, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProductFormModal from '@/components/ProductFormModal';
import ProductImportModal from '@/components/ProductImportModal';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('deleteSuccess'));
      setDeleteTarget(null);
    },
  });

  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    return (
      (p.name_zh || '').toLowerCase().includes(term) ||
      (p.name_en || '').toLowerCase().includes(term) ||
      (p.category_zh || '').toLowerCase().includes(term) ||
      (p.category_en || '').toLowerCase().includes(term)
    );
  });

  const getName = (p) => language === 'zh' ? (p.name_zh || p.name_en) : (p.name_en || p.name_zh);
  const getCategory = (p) => language === 'zh' ? (p.category_zh || p.category_en) : (p.category_en || p.category_zh);
  const getUnit = (p) => language === 'zh' ? (p.unit_zh || p.unit_en) : (p.unit_en || p.unit_zh);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('products')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{language === 'zh' ? `共 ${filtered.length} 項商品` : `${filtered.length} products`}</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-52"
            />
          </div>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <FileSpreadsheet size={16} className="mr-1.5" /> {language === 'zh' ? '匯入' : 'Import'}
          </Button>
          <Button onClick={() => { setEditProduct(null); setShowForm(true); }}>
            <Plus size={16} className="mr-1.5" /> {t('addProduct')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <Card key={product.id} className={`transition-all ${product.is_active === false ? 'opacity-50' : 'hover:shadow-md'}`}>
              <CardContent className="p-4">
                {product.image_url && (
                  <div className="w-full h-36 rounded-lg overflow-hidden mb-3 bg-muted">
                    <img src={product.image_url} alt={getName(product)} className="w-full h-full object-cover" />
                  </div>
                )}
                {!product.image_url && (
                  <div className="w-full h-24 rounded-lg bg-primary/5 flex items-center justify-center mb-3">
                    <Package className="text-primary/30" size={32} />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{getName(product)}</p>
                    {getCategory(product) && (
                      <p className="text-xs text-muted-foreground mt-0.5">{getCategory(product)}</p>
                    )}
                  </div>
                  <Badge variant={product.is_active === false ? 'secondary' : 'default'} className="text-xs shrink-0">
                    {product.is_active === false ? t('productInactive') : t('productActive')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-lg font-bold text-primary">NT${(product.unit_price || 0).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">/{getUnit(product)}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditProduct(product); setShowForm(true); }}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(product)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">{t('noData')}</div>
          )}
        </div>
      )}

      {showImport && <ProductImportModal onClose={() => setShowImport(false)} />}

      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => setShowForm(false)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          title={t('deleteProduct')}
          message={t('deleteConfirmMsg')}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
