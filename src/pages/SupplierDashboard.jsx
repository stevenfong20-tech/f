import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingCart, Store, Clock, ArrowRight, UserPlus, Mail, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import DailyBranchReport from '@/components/DailyBranchReport';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function SupplierDashboard() {
  const { t, language } = useLanguage();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteStatus(null);
    setInviteLoading(true);
    await base44.users.inviteUser(inviteEmail, inviteRole);
    setInviteStatus({ type: 'success', message: `Invitation sent to ${inviteEmail}` });
    setInviteEmail('');
    setInviteLoading(false);
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => base44.entities.Branch.list(),
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const activeBranchCount = branches.filter(b => b.is_active !== false).length;

  const branchOrderMap = {};
  orders.forEach(order => {
    if (!branchOrderMap[order.branch_id]) {
      branchOrderMap[order.branch_id] = { name: order.branch_name, total: 0, count: 0 };
    }
    branchOrderMap[order.branch_id].total += order.total_amount || 0;
    branchOrderMap[order.branch_id].count += 1;
  });
  const topBranches = Object.entries(branchOrderMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const recentOrders = orders.slice(0, 8);

  const statusLabel = (s) => {
    const map = { pending: t('pending'), preparing: t('preparing'), ready_for_pickup: t('ready_for_pickup'), completed: t('completed'), cancelled: t('cancelled') };
    return map[s] || s;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{language === 'zh' ? '歡迎回來，以下是最新概況' : 'Welcome back, here\'s the latest overview'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label={t('totalOrders')} value={orders.length} color="blue" />
        <StatCard icon={TrendingUp} label={t('totalRevenue')} value={`NT$${totalRevenue.toLocaleString()}`} color="green" />
        <StatCard icon={Store} label={t('activeBranches')} value={activeBranchCount} color="purple" />
        <StatCard icon={Clock} label={t('pendingOrders')} value={pendingCount} color="orange" />
      </div>

      <DailyBranchReport orders={orders} branches={branches} />

      {/* Invite User */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus size={16} />
            {language === 'zh' ? '邀請新用戶' : 'Invite New User'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="inv-email">{language === 'zh' ? '電子郵件' : 'Email'}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="inv-email"
                  type="email"
                  placeholder="manager@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-role">{language === 'zh' ? '角色' : 'Role'}</Label>
              <select
                id="inv-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="user">{language === 'zh' ? '分店管理員 (User)' : 'Branch Manager (User)'}</option>
                <option value="admin">{language === 'zh' ? '供應商管理員 (Admin)' : 'Supplier Admin'}</option>
              </select>
            </div>
            <Button type="submit" disabled={inviteLoading} className="shrink-0">
              {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-1" />{language === 'zh' ? '發送邀請' : 'Send Invite'}</>}
            </Button>
          </form>
          {inviteStatus && (
            <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${inviteStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
              {inviteStatus.type === 'success' && <Check size={14} />}
              {inviteStatus.message}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">{t('recentOrders')}</CardTitle>
            <Link to="/orders" className="text-primary text-sm flex items-center gap-1 hover:underline">
              {language === 'zh' ? '查看全部' : 'View all'} <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">{t('branch')}</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">{t('date')}</th>
                    <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">{t('amount')}</th>
                    <th className="text-center px-4 py-2.5 text-muted-foreground font-medium">{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium">{order.branch_name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {order.order_date ? format(new Date(order.order_date), 'MM/dd') : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">NT${(order.total_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{t('noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Branches */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t('topBranches')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBranches.map(([id, data], idx) => (
              <div key={id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{data.name}</p>
                  <p className="text-xs text-muted-foreground">{data.count} {language === 'zh' ? '筆訂單' : 'orders'}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">NT${data.total.toLocaleString()}</span>
              </div>
            ))}
            {topBranches.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon size={18} />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
