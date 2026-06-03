import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Globe, UserPlus, Loader2, Mail } from 'lucide-react';

export default function SettingsPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(null); // { type: 'success'|'error', message }

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteStatus(null);
    setInviteLoading(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteStatus({ type: 'success', message: `Invitation sent to ${inviteEmail}` });
      setInviteEmail('');
    } catch (err) {
      setInviteStatus({ type: 'error', message: err.message || 'Failed to send invitation' });
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-bold">{t('settings')}</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe size={16} />
            {t('language')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { code: 'zh', label: '繁體中文', sublabel: 'Traditional Chinese' },
            { code: 'en', label: 'English', sublabel: 'English' },
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                language === lang.code
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80 hover:bg-muted/30'
              }`}
            >
              <div className="text-left">
                <p className="font-medium text-sm">{lang.label}</p>
                <p className="text-xs text-muted-foreground">{lang.sublabel}</p>
              </div>
              {language === lang.code && (
                <Check size={16} className="text-primary" />
              )}
            </button>
          ))}
        </CardContent>
      </Card>
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus size={16} />
              Invite Branch Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Send an invitation email to a branch manager. They will receive a link to set their password and log in.
            </p>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
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
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="user">Branch Manager (User)</option>
                  <option value="admin">Supplier Admin</option>
                </select>
              </div>
              {inviteStatus && (
                <div className={`p-3 rounded-lg text-sm ${inviteStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                  {inviteStatus.message}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={inviteLoading}>
                {inviteLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" />Send Invitation</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
