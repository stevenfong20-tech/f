import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function BranchFormModal({ branch, onClose }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name_zh: branch?.name_zh || '',
    name_en: branch?.name_en || '',
    address: branch?.address || '',
    phone: branch?.phone || '',
    manager_name: branch?.manager_name || '',
    user_id: branch?.user_id || '',
  });

  const mutation = useMutation({
    mutationFn: (data) => branch
      ? base44.entities.Branch.update(branch.id, data)
      : base44.entities.Branch.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(t('saveSuccess'));
      onClose();
    },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{branch ? t('editBranch') : t('addBranch')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">分店名稱（中文）*</Label>
              <Input value={form.name_zh} onChange={e => set('name_zh', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Branch Name (EN)</Label>
              <Input value={form.name_en} onChange={e => set('name_en', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t('address')}</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t('phone')}</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{t('manager')}</Label>
            <Input value={form.manager_name} onChange={e => set('manager_name', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">關聯用戶 ID / User ID</Label>
            <Input value={form.user_id} onChange={e => set('user_id', e.target.value)} placeholder="用戶帳號 ID" />
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
