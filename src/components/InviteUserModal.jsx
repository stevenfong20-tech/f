import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Store, Send, Copy, Check, Link } from 'lucide-react';
import { toast } from 'sonner';

const APP_URL = window.location.origin;

export default function InviteUserModal({ onClose }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const zh = language === 'zh';

  const [email, setEmail] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !branchName.trim()) return;
    setIsLoading(true);

    // 1. Create a pending Branch record
    const branch = await base44.entities.Branch.create({
      name_zh: branchName,
      invited_email: email.trim().toLowerCase(),
      invite_status: 'pending',
      is_active: true,
    });

    // 2. Build the magic link pointing to /register with invite param
    const link = `${APP_URL}/register?invite=${branch.id}&email=${encodeURIComponent(email.trim())}`;
    setInviteLink(link);

    // 3. Send invitation email
    await base44.integrations.Core.SendEmail({
      to: email.trim(),
      subject: zh ? '您已受邀加入正好吃鹹酥雞訂購系統' : 'You are invited to join the ordering system',
      body: `${zh ? '您好！您已受邀成為分店帳號。\n\n請點擊以下連結完成註冊：' : 'Hello! You have been invited as a branch user.\n\nPlease click the link below to complete registration:'}\n\n${link}\n\n${zh ? '若您未預期收到此郵件，請忽略。' : 'If you did not expect this, please ignore.'}`,
    });

    queryClient.invalidateQueries({ queryKey: ['branches'] });
    toast.success(zh ? `邀請已發送至 ${email}` : `Invitation sent to ${email}`);
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(zh ? '連結已複製' : 'Link copied!');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store size={18} />
            {zh ? '邀請新分店' : 'Invite New Branch'}
          </DialogTitle>
        </DialogHeader>

        {!inviteLink ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {zh
                ? '填寫分店名稱與負責人Email，系統將自動建立分店並發送專屬邀請連結。'
                : 'Enter the branch name and owner email. The system will create the branch and send a unique invite link.'}
            </p>

            <div>
              <Label className="text-xs mb-1 block">
                <Store size={12} className="inline mr-1" />
                {zh ? '分店名稱' : 'Branch Name'}
              </Label>
              <Input
                placeholder={zh ? '例：台北信義店' : 'e.g. Taipei Xinyi Branch'}
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                <Mail size={12} className="inline mr-1" />
                {zh ? '負責人電子郵件' : 'Branch Owner Email'}
              </Label>
              <Input
                type="email"
                placeholder={zh ? '輸入電子郵件...' : 'Enter email address...'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={onClose}>{zh ? '取消' : 'Cancel'}</Button>
              <Button
                onClick={handleSend}
                disabled={isLoading || !email.trim() || !branchName.trim()}
              >
                {isLoading ? (zh ? '處理中...' : 'Sending...') : (
                  <><Send size={14} className="mr-1.5" />{zh ? '發送邀請' : 'Send Invite'}</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Send size={14} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  {zh ? '邀請已發送！' : 'Invitation sent!'}
                </p>
                <p className="text-xs text-green-600">{email}</p>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block flex items-center gap-1">
                <Link size={12} />
                {zh ? '邀請連結（可手動分享）' : 'Invite Link (share manually)'}
              </Label>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground flex-1 truncate">{inviteLink}</p>
                <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1.5 h-7">
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  {copied ? (zh ? '已複製' : 'Copied') : (zh ? '複製' : 'Copy')}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {zh
                ? '分店負責人點擊連結後，系統將自動完成分店帳號設定。'
                : 'Once the branch owner clicks the link and registers, they will be automatically linked to this branch.'}
            </p>

            <Button className="w-full" onClick={onClose}>
              {zh ? '完成' : 'Done'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
