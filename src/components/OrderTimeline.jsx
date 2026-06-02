import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const STATUS_FLOW = ['pending', 'preparing', 'ready_for_pickup', 'completed'];

const statusLabel = (s, t) => {
  const map = { pending: t('pending'), preparing: t('preparing'), ready_for_pickup: t('ready_for_pickup'), completed: t('completed'), cancelled: t('cancelled') };
  return map[s] || s;
};

export default function OrderTimeline({ order }) {
  const { t, language } = useLanguage();
  const history = order.status_history || [];

  // Build timeline: always show created_date as first entry, then status_history entries
  const entries = [
    { status: 'pending', timestamp: order.created_date, label: language === 'zh' ? '訂單建立' : 'Order Created' },
    ...history.filter(h => h.status !== 'pending').map(h => ({ status: h.status, timestamp: h.timestamp, label: statusLabel(h.status, t) })),
  ];

  return (
    <div className="pt-3 border-t border-border/50">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {language === 'zh' ? '訂單時間軸' : 'Order Timeline'}
      </p>
      <div className="space-y-0">
        {entries.map((entry, idx) => {
          const isLast = idx === entries.length - 1;
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  entry.status === 'completed' ? 'bg-green-100 text-green-600' :
                  entry.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                  idx === entries.length - 1 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {entry.status === 'completed' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                </div>
                {!isLast && <div className="w-px h-6 bg-border mt-1" />}
              </div>
              <div className="pb-4 min-w-0">
                <p className="text-sm font-medium leading-tight">{entry.label}</p>
                {entry.timestamp && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(entry.timestamp), 'yyyy/MM/dd HH:mm')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
