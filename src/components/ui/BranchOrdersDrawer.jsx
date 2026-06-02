import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'];

export default function BranchOrdersDrawer({ branch, orders, onClose }) {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();

  const getName = (b) => language === 'zh' ? (b.name_zh || b.name_en) : (b.name_en || b.name_zh);

  const totalAmount = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalItems = orders.reduce((s, o) => s + (o.items?.length || 0), 0);

  // Combined product totals
  const productTotals = {};
  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const key = item.product_id;
      if (!productTotals[key]) {
        productTotals[key] = {
          name: language === 'zh' ? item.product_name_zh : item.product_name_en,
          qty: 0,
          subtotal: 0,
          unit: language === 'zh' ? item.unit_zh : item.unit_en,
        };
      }
      productTotals[key].qty += item.quantity || 0;
      productTotals[key].subtotal += item.subtotal || 0;
    });
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(t('saveSuccess'));
    },
  });

  const statusLabel = (s) => {
    const map = { pending: t('pending'), confirmed: t('confirmed'), processing: t('processing'), delivered: t('delivered'), cancelled: t('cancelled') };
    return map[s] || s;
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-xl">{getName(branch)}</SheetTitle>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>{orders.length} {language === 'zh' ? '筆訂單' : 'orders'}</span>
            <span className="font-semibold text-foreground">NT${totalAmount.toLocaleString()}</span>
          </div>
        </SheetHeader>

        {/* Combined product summary */}
        {Object.keys(productTotals).length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-accent/50 border border-border">
            <h3 className="font-semibold text-sm mb-3">{t('combinedOrders')}</h3>
            <div className="space-y-1.5">
              {Object.entries(productTotals).map(([id, item]) => (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.name}</span>
                  <div className="flex gap-4 text-right">
                    <span className="text-muted-foreground">{item.qty} {item.unit}</span>
                    <span className="font-medium w-24 text-right">NT${item.subtotal.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-border flex justify-between font-semibold text-sm">
                <span>{t('total')}</span>
                <span className="text-primary">NT${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Individual orders */}
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {order.order_date ? format(new Date(order.order_date), 'yyyy/MM/dd') : '-'}
                </span>
                <div className="flex items-center gap-2">
                  <Select
                    value={order.status}
                    onValueChange={(v) => statusMutation.mutate({ id: order.id, status: v })}
                  >
                    <SelectTrigger className="h-7 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s} className="text-xs">{statusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-foreground">{language === 'zh' ? item.product_name_zh : item.product_name_en} × {item.quantity}</span>
                    <span className="text-muted-foreground">NT${(item.subtotal || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border/60 flex justify-between text-sm font-semibold">
                <span>{t('total')}</span>
                <span className="text-primary">NT${(order.total_amount || 0).toLocaleString()}</span>
              </div>
              {order.notes && <p className="text-xs text-muted-foreground mt-1">{order.notes}</p>}
            </div>
          ))}
          {orders.length === 0 && <p className="text-center text-muted-foreground py-8">{t('noData')}</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
