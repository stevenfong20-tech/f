import { useLanguage } from '@/lib/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirmDialog({ title, message, onConfirm, onCancel, isLoading }) {
  const { t } = useLanguage();
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={18} />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onCancel}>{t('cancel')}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('loading') : t('confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
