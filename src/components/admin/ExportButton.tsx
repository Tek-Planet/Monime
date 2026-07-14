import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExportButtonProps {
  data: any[];
  filename: string;
  headers: string[];
}

export function ExportButton({ data, filename, headers }: ExportButtonProps) {
  const { t } = useLanguage();

  const exportToCSV = () => {
    try {
      if (data.length === 0) { toast.error(t('admin.noDataToExport')); return; }
      const csvHeader = headers.join(',');
      const csvRows = data.map(row => {
        return headers.map(header => {
          const value = row[header.toLowerCase().replace(/ /g, '_')];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) return `"${stringValue.replace(/"/g, '""')}"`;
          return stringValue;
        }).join(',');
      });
      const csvContent = [csvHeader, ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('admin.exportCompleted'));
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(t('admin.failedToExport'));
    }
  };

  return (
    <Button onClick={exportToCSV} variant="default" size="sm" className="text-center">
      <Download className="w-4 h-4 mr-2" />
      {t("admin.exportCsv")}
    </Button>
  );
}