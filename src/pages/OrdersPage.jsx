import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import OrderTimeline from '@/components/OrderTimeline';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['all', 'pending', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready_for_pickup: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => base44.entities.Branch.list(),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, order }) => {
      const newHistory = [...(order.status_history || []), { status, timestamp: new Date().toISOString() }];
      await base44.entities.Order.update(id, { status, status_history: newHistory });

      // Email notification when ready for pickup
      if (status === 'ready_for_pickup') {
        const branch = branches.find(b => b.id === order.branch_id);
        const recipientEmail = branch?.invited_email || null;
        if (recipientEmail) {
          await base44.integrations.Core.SendEmail({
            to: recipientEmail,
            subject: '您的訂單已可取餐 / Your order is ready for pickup',
            body: `您好，\n\n您在「正好吃鹹酥雞」的訂單（${order.order_date}，NT$${order.total_amount?.toLocaleString()}）現在已可取餐。\n\nHello,\n\nYour order dated ${order.order_date} (NT$${order.total_amount?.toLocaleString()}) is now ready for pickup!\n\n謝謝 / Thank you`,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(t('saveSuccess'));
    },
  });

  const statusLabel = (s) => {
    const map = { pending: t('pending'), preparing: t('preparing'), ready_for_pickup: t('ready_for_pickup'), completed: t('completed'), cancelled: t('cancelled') };
    return map[s] || s;
  };

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch = !search || (o.branch_name || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('orders')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {language === 'zh' ? `共 ${filtered.length} 筆訂單` : `${filtered.length} orders`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={language === 'zh' ? '搜尋分店名稱...' : 'Search branch...'} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>{s === 'all' ? (language === 'zh' ? '全部狀態' : 'All Status') : statusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <span className="font-medium truncate">{order.branch_name}</span>
                    <span className="text-muted-foreground">
                      {order.order_date ? format(new Date(order.order_date), 'yyyy/MM/dd') : '-'}
                    </span>
                    <span className="font-semibold text-primary">NT${(order.total_amount || 0).toLocaleString()}</span>
                    <div>
                      <Select
                        value={order.status}
                        onValueChange={(v) => { statusMutation.mutate({ id: order.id, status: v, order }); }}
                        onClick={e => e.stopPropagation()}
                      >
                        <SelectTrigger className="h-7 text-xs w-32" onClick={e => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{statusLabel(s)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {expandedId === order.id ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                </div>
                {expandedId === order.id && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    <div className="mt-3 space-y-1">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span>{language === 'zh' ? item.product_name_zh : item.product_name_en} × {item.quantity} {language === 'zh' ? item.unit_zh : item.unit_en}</span>
                          <span className="font-medium">NT${(item.subtotal || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    {order.special_instructions && (
                      <p className="text-xs bg-orange-50 text-orange-700 rounded-lg px-3 py-2 mt-2">
                        ⚡ {order.special_instructions}
                      </p>
                    )}
                    {order.notes && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">{order.notes}</p>}
                    <OrderTimeline order={order} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">{t('noData')}</div>
          )}
        </div>
      )}
    </div>
  );
}
