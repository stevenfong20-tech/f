import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { toast } from 'sonner';

const EXPECTED_SCHEMA = {
  type: 'object',
  properties: {
    name_zh: { type: 'string' },
    name_en: { type: 'string' },
    category_zh: { type: 'string' },
    category_en: { type: 'string' },
    unit_price: { type: 'number' },
    unit_zh: { type: 'string' },
    unit_en: { type: 'string' },
    description_zh: { type: 'string' },
    description_en: { type: 'string' },
    min_order_qty: { type: 'number' },
    is_active: { type: 'boolean' },
  },
};

export default function ProductImportModal({ onClose }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | preview | importing | done | error
  const [preview, setPreview] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema: EXPECTED_SCHEMA });
    if (result.status !== 'success' || !result.output) {
      setErrorMsg(result.details || 'Failed to parse file');
      setStatus('error');
      return;
    }
    const rows = Array.isArray(result.output) ? result.output : [result.output];
    setPreview(rows);
    setStatus('preview');
  };

  const handleImport = async () => {
    setStatus('importing');
    let count = 0;
    for (const row of preview) {
      if (!row.name_zh && !row.name_en) continue;
      await base44.entities.Product.create({
        ...row,
        unit_price: Number(row.unit_price) || 0,
        min_order_qty: Number(row.min_order_qty) || 1,
        is_active: row.is_active !== false,
      });
      count++;
    }
    setImportedCount(count);
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setStatus('done');
    toast.success(language === 'zh' ? `成功匯入 ${count} 項商品` : `Imported ${count} products`);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} />
            {language === 'zh' ? '從試算表匯入商品' : 'Import Products from Spreadsheet'}
          </DialogTitle>
        </DialogHeader>

        {status === 'idle' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{language === 'zh' ? '支援格式：CSV、Excel (.xlsx)' : 'Supported: CSV, Excel (.xlsx)'}</p>
              <p>{language === 'zh' ? '建議欄位：name_zh, name_en, category_zh, unit_price, unit_zh, min_order_qty' : 'Suggested columns: name_zh, name_en, category_zh, unit_price, unit_zh, min_order_qty'}</p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl py-10 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
            >
              <Upload size={28} className="text-muted-foreground" />
              <span className="text-sm font-medium">{language === 'zh' ? '點擊上傳檔案' : 'Click to upload file'}</span>
              <span className="text-xs text-muted-foreground">CSV / XLSX</span>
            </button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">{language === 'zh' ? '分析中...' : 'Analyzing file...'}</p>
          </div>
        )}

        {status === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'zh' ? `找到 ${preview.length} 項商品，確認後將全部匯入` : `Found ${preview.length} products. Confirm to import all.`}
            </p>
            <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">名稱 / Name</th>
                    <th className="text-left px-3 py-2 font-medium">分類</th>
                    <th className="text-right px-3 py-2 font-medium">單價</th>
                    <th className="text-left px-3 py-2 font-medium">單位</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-3 py-1.5">{row.name_zh || row.name_en || '-'}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.category_zh || row.category_en || '-'}</td>
                      <td className="px-3 py-1.5 text-right font-medium">NT${Number(row.unit_price || 0).toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.unit_zh || row.unit_en || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>{language === 'zh' ? '取消' : 'Cancel'}</Button>
              <Button onClick={handleImport}>{language === 'zh' ? `匯入 ${preview.length} 項` : `Import ${preview.length} items`}</Button>
            </div>
          </div>
        )}

        {status === 'importing' && (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">{language === 'zh' ? '匯入中...' : 'Importing...'}</p>
          </div>
        )}

        {status === 'done' && (
          <div className="flex flex-col items-center py-10 gap-3">
            <CheckCircle size={40} className="text-green-500" />
            <p className="font-semibold">{language === 'zh' ? `成功匯入 ${importedCount} 項商品！` : `Successfully imported ${importedCount} products!`}</p>
            <Button onClick={onClose}>{language === 'zh' ? '完成' : 'Done'}</Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-10 gap-3">
            <AlertCircle size={40} className="text-destructive" />
            <p className="text-sm text-destructive">{errorMsg}</p>
            <Button variant="outline" onClick={() => setStatus('idle')}>{language === 'zh' ? '重試' : 'Try Again'}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
