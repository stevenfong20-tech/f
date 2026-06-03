import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Plus, Store, Phone, MapPin, ChevronRight, Pencil, Trash2, UserPlus, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BranchFormModal from '@/components/BranchFormModal';
import BranchOrdersDrawer from '@/components/BranchOrdersDrawer';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import InviteUserModal from '@/components/InviteUserModal';
import { toast } from 'sonner';

export default function BranchesPage() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState('');

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => base44.entities.Branch.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Branch.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(t('deleteSuccess'));
      setDeleteTarget(null);
    },
  });

  const getBranchStats = (branchId) => {
    const branchOrders = orders.filter(o => o.branch_id === branchId);
    const total = branchOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return { count: branchOrders.length, total };
  };

  const getName = (b) => language === 'zh' ? (b.name_zh || b.name_en) : (b.name_en || b.name_zh);

  const filteredBranches = branches.filter(b => {
    const term = search.toLowerCase();
    return !term ||
      (b.name_zh || '').toLowerCase().includes(term) ||
      (b.name_en || '').toLowerCase().includes(term) ||
      (b.manager_name || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('branches')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {language === 'zh' ? `共 ${branches.length} 間分店` : `${branches.length} branches`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === 'zh' ? '搜尋分店或負責人...' : 'Search branch or manager...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-56"
            />
          </div>
          <Button variant="outline" onClick={() => setShowInvite(true)}>
            <UserPlus size={16} className="mr-1.5" /> {language === 'zh' ? '邀請用戶' : 'Invite User'}
          </Button>
          <Button onClick={() => { setEditBranch(null); setShowForm(true); }}>
            <Plus size={16} className="mr-1.5" /> {t('addBranch')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map(branch => {
            const stats = getBranchStats(branch.id);
            return (
              <Card key={branch.id} className="hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedBranch(branch)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Store className="text-primary" size={20} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditBranch(branch); setShowForm(true); }}>
                        <Pencil size={13} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(branch)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{getName(branch)}</h3>
                    {branch.invite_status === 'pending' && !branch.user_id && (
                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300 bg-yellow-50 gap-1">
                        <Clock size={10} /> {language === 'zh' ? '待確認' : 'Pending'}
                      </Badge>
                    )}
                  </div>
                  {branch.invited_email && !branch.user_id && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <UserPlus size={11} /> {branch.invited_email}
                    </p>
                  )}
                  {branch.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin size={11} /> {branch.address}
                    </p>
                  )}
                  {branch.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone size={11} /> {branch.phone}
                    </p>
                  )}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-primary">NT${stats.total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{stats.count} {language === 'zh' ? '筆訂單' : 'orders'}</p>
                    </div>
                    <ChevronRight className="text-muted-foreground" size={16} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredBranches.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">{t('noData')}</div>
          )}
        </div>
      )}

      {showForm && (
        <BranchFormModal
          branch={editBranch}
          onClose={() => setShowForm(false)}
        />
      )}

      {selectedBranch && (
        <BranchOrdersDrawer
          branch={selectedBranch}
          orders={orders.filter(o => o.branch_id === selectedBranch.id)}
          onClose={() => setSelectedBranch(null)}
        />
      )}

      {showInvite && <InviteUserModal onClose={() => setShowInvite(false)} />}

      {deleteTarget && (
        <DeleteConfirmDialog
          title={language === 'zh' ? '刪除分店' : 'Delete Branch'}
          message={language === 'zh' ? '確定要刪除此分店嗎？此操作無法復原。' : 'Are you sure you want to delete this branch?'}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
