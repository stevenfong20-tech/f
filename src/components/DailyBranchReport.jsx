import { useState } from 'react';
import { format, subDays, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function DailyBranchReport({ orders, branches }) {
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayOrders = orders.filter(o => o.order_date === dateStr && o.status !== 'cancelled');

  // Per-branch totals
  const branchMap = {};
  dayOrders.forEach(o => {
    if (!branchMap[o.branch_id]) branchMap[o.branch_id] = { name: o.branch_name, total: 0, count: 0 };
    branchMap[o.branch_id].total += o.total_amount || 0;
    branchMap[o.branch_id].count += 1;
  });

  // Top-selling products
  const productMap = {};
  dayOrders.forEach(o => {
    (o.items || []).forEach(item => {
      const key = item.product_id;
      if (!productMap[key]) productMap[key] = { name: language === 'zh' ? item.product_name_zh : item.product_name_en, qty: 0, revenue: 0 };
      productMap[key].qty += item.quantity || 0;
      productMap[key].revenue += item.subtotal || 0;
    });
  });

  const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const branchRows = Object.values(branchMap).sort((a, b) => b.total - a.total);
  const dayTotal = dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart2 size={16} />
            {language === 'zh' ? '每日分店報表' : 'Daily Branch Report'}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedDate(d => subDays(d, 1))}>
              <ChevronLeft size={14} />
            </Button>
            <span className="text-sm font-medium px-1 min-w-[90px] text-center">{format(selectedDate, 'MM/dd/yyyy')}</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedDate(d => subDays(d, -1))} disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dayOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{language === 'zh' ? '當日無訂單' : 'No orders on this day'}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Branch totals */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {language === 'zh' ? '各分店金額' : 'Branch Totals'}
              </p>
              <div className="space-y-2">
                {branchRows.map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{b.name}</span>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-muted-foreground text-xs">{b.count} {language === 'zh' ? '筆' : 'orders'}</span>
                      <span className="font-semibold text-primary">NT${b.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between font-bold text-sm">
                  <span>{language === 'zh' ? '當日合計' : 'Day Total'}</span>
                  <span className="text-primary">NT${dayTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            {/* Top products */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {language === 'zh' ? '熱賣商品' : 'Top Products'}
              </p>
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-muted-foreground text-xs">{p.qty} {language === 'zh' ? '件' : 'pcs'}</span>
                      <span className="font-semibold">NT${p.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
