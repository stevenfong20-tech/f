import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import OrderTimeline from '@/components/OrderTimeline';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready_for_pickup: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [expandedId, setExpandedId] = useState(null);

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => base44.entities.Branch.list(),
  });

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const myBranch = branches.find(b => b.user_id === user?.id);
  const orders = myBranch ? allOrders.filter(o => o.branch_id === myBranch.id) : [];

  const statusLabel = (s) => {
    const map = { pending: t('pending'), preparing: t('preparing'), ready_for_pickup: t('ready_for_pickup'), completed: t('completed'), cancelled: t('cancelled') };
    return map[s] || s;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('orderHistory')}</h1>
        {myBranch && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {language === 'zh' ? myBranch.name_zh : (myBranch.name_en || myBranch.name_zh)}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {order.order_date ? format(new Date(order.order_date), 'yyyy/MM/dd') : '-'}
                    </span>
                    <span className="font-bold text-primary">NT${(order.total_amount || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  {expandedId === order.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
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
          {orders.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-base font-medium">{language === 'zh' ? '尚無訂單' : 'No orders yet'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
