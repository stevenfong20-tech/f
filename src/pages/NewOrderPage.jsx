import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Plus, Minus, ShoppingCart, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function NewOrderPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showVarianceAlert, setShowVarianceAlert] = useState(false);
  const [varianceInfo, setVarianceInfo] = useState(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => base44.entities.Branch.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  // Find branch by user_id first, then fall back to invited_email match
  const myBranch = branches.find(b => b.user_id === user?.id) ||
    branches.find(b => !b.user_id && b.invited_email && b.invited_email.toLowerCase() === user?.email?.toLowerCase());

  // Auto-link: if found by email but user_id not set yet, update the branch
  useEffect(() => {
    if (!user || !myBranch) return;
    if (!myBranch.user_id && myBranch.invited_email) {
      base44.entities.Branch.update(myBranch.id, {
        user_id: user.id,
        invite_status: 'accepted',
      }).then(() => queryClient.invalidateQueries({ queryKey: ['branches'] }));
    }
  }, [myBranch?.id, user?.id]);

  const activeProducts = products.filter(p => p.is_active !== false);

  // Group products by category
  const categories = {};
  activeProducts.forEach(p => {
    const cat = language === 'zh' ? (p.category_zh || '其他') : (p.category_en || 'Other');
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(p);
  });

  const getName = (p) => language === 'zh' ? (p.name_zh || p.name_en) : (p.name_en || p.name_zh);
  const getUnit = (p) => language === 'zh' ? (p.unit_zh || p.unit_en) : (p.unit_en || p.unit_zh);

  const updateCart = (productId, delta) => {
    setCart(prev => {
      const cur = prev[productId] || 0;
      const next = Math.max(0, cur + delta);
      if (next === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const cartItems = Object.entries(cart)
    .map(([productId, qty]) => {
      const product = products.find(p => p.id === productId);
      if (!product) return null;
      return {
        product_id: productId,
        product_name_zh: product.name_zh,
        product_name_en: product.name_en,
        quantity: qty,
        unit_price: product.unit_price,
        unit_zh: product.unit_zh,
        unit_en: product.unit_en,
        subtotal: product.unit_price * qty,
      };
    })
    .filter(Boolean);

  const totalAmount = cartItems.reduce((s, i) => s + i.subtotal, 0);

  const submitMutation = useMutation({
    mutationFn: (orderData) => base44.entities.Order.create(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(t('orderSuccess'));
      setCart({});
      setNotes('');
      setSpecialInstructions('');
    },
  });

  const calculateVariance = () => {
    if (!myBranch) return null;
    const branchOrders = orders
      .filter(o => o.branch_id === myBranch.id && o.status !== 'cancelled')
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    
    if (branchOrders.length === 0) return null;
    const lastOrder = branchOrders[0];
    const lastTotal = lastOrder.total_amount || 0;
    if (lastTotal === 0) return null;

    const diff = Math.abs(totalAmount - lastTotal) / lastTotal * 100;
    return { diff, lastTotal, direction: totalAmount > lastTotal ? 'increase' : 'decrease', lastOrderDate: lastOrder.order_date };
  };

  const handleSubmit = () => {
    if (cartItems.length === 0) return;
    if (!myBranch && user?.role !== 'admin') {
      toast.error(language === 'zh' ? '找不到您的分店資料，請聯絡管理員' : 'Branch not found, contact admin');
      return;
    }

    const variance = calculateVariance();
    if (variance && variance.diff > 60) {
      setVarianceInfo(variance);
      setShowVarianceAlert(true);
      return;
    }
    doSubmit();
  };

  const doSubmit = () => {
    const branchId = myBranch?.id || 'direct';
    const branchName = myBranch ? (language === 'zh' ? myBranch.name_zh : (myBranch.name_en || myBranch.name_zh)) : user?.full_name;
    submitMutation.mutate({
      branch_id: branchId,
      branch_name: branchName,
      items: cartItems,
      total_amount: totalAmount,
      notes,
      special_instructions: specialInstructions,
      order_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'pending',
      status_history: [{ status: 'pending', timestamp: new Date().toISOString() }],
    });
    setShowVarianceAlert(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('newOrder')}</h1>
        {myBranch && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('myBranch')}: <span className="font-medium text-foreground">
              {language === 'zh' ? myBranch.name_zh : (myBranch.name_en || myBranch.name_zh)}
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Product list */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(categories).map(([cat, prods]) => (
            <Card key={cat}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {prods.map(product => {
                  const qty = cart[product.id] || 0;
                  return (
                    <div key={product.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={getName(product)} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                          <Package size={16} className="text-primary/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{getName(product)}</p>
                        <p className="text-xs text-primary font-semibold">NT${product.unit_price.toLocaleString()} / {getUnit(product)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant={qty > 0 ? 'default' : 'outline'}
                          className="h-7 w-7"
                          onClick={() => updateCart(product.id, -1)}
                          disabled={qty === 0}
                        >
                          <Minus size={12} />
                        </Button>
                        <span className="w-7 text-center text-sm font-medium">{qty}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateCart(product.id, 1)}
                        >
                          <Plus size={12} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
          {activeProducts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">{t('noData')}</div>
          )}
        </div>

        {/* Order summary */}
        <div>
          <Card className="sticky top-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart size={16} />
                {language === 'zh' ? '訂單摘要' : 'Order Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cartItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === 'zh' ? '尚未選擇商品' : 'No items selected'}
                </p>
              ) : (
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span className="truncate flex-1">{language === 'zh' ? item.product_name_zh : item.product_name_en} × {item.quantity}</span>
                      <span className="font-medium ml-2">NT${item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex justify-between font-bold text-base">
                    <span>{t('total')}</span>
                    <span className="text-primary">NT${totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
              <Textarea
                placeholder={language === 'zh' ? '備註（選填）' : 'Notes (optional)'}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <Textarea
                placeholder={language === 'zh' ? '特殊指示（例如：加辣、不加蒜）' : 'Special instructions (e.g. extra spicy, no garlic)'}
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <Button
                className="w-full"
                disabled={cartItems.length === 0 || submitMutation.isPending}
                onClick={handleSubmit}
              >
                {submitMutation.isPending ? t('loading') : t('placeOrder')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Variance Alert */}
      {showVarianceAlert && varianceInfo && (
        <Dialog open onOpenChange={() => setShowVarianceAlert(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle size={18} />
                {t('variantAlert')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">{t('variantAlertMsg')}</p>
              <div className="bg-orange-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('previousOrder')}</span>
                  <span className="font-medium">NT${varianceInfo.lastTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('currentOrder')}</span>
                  <span className="font-medium">NT${totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-orange-200">
                  <span className="text-muted-foreground">{language === 'zh' ? '變動幅度' : 'Change'}</span>
                  <span className={`font-bold ${varianceInfo.direction === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {varianceInfo.direction === 'increase' ? '↑' : '↓'} {varianceInfo.diff.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowVarianceAlert(false)}>{t('cancel')}</Button>
              <Button onClick={doSubmit} className="bg-orange-500 hover:bg-orange-600">
                {language === 'zh' ? '確定送出' : 'Proceed Anyway'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
