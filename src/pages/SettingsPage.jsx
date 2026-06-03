import { useLanguage } from '@/lib/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { t, language, toggleLanguage } = useLanguage();

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
    </div>
  );
}
