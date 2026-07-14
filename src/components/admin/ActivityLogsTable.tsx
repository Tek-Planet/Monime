import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButton } from './ExportButton';
import { formatDistanceToNow } from 'date-fns';
import { useAdminActivityLogs } from '@/hooks/admin/useAdminActivityLogs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

interface ActivityLogsTableProps {
  ngoId?: string;
}

export function ActivityLogsTable({ ngoId }: ActivityLogsTableProps) {
  const { t } = useLanguage();
  const { data: logs = [], isLoading } = useAdminActivityLogs(100, ngoId);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return logs.slice(start, start + ITEMS_PER_PAGE);
  }, [logs, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const exportData = logs.map(log => ({
    action: log.action, user_id: log.user_id, entity_type: log.entity_type || '-',
    entity_id: log.entity_id || '-', ip_address: log.ip_address || '-',
    created_at: new Date(log.created_at).toLocaleString()
  }));

  return (
    <Card>
      <CardHeader className="flex flex-col lg:flex-row lg:items-center items-start gap-2 justify-between space-y-0 pb-4">
        <div>
          <CardTitle>{t("admin.activityLogsTitle")}</CardTitle>
          <CardDescription>{t("admin.recentActivities")}</CardDescription>
        </div>
        <ExportButton data={exportData} filename="activity_logs" headers={[t("admin.action"), 'User ID', t("admin.entity") + ' Type', t("admin.entity") + ' ID', 'IP', t("admin.created")]} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : logs.length === 0 ? (
          <p className="text-muted-foreground">{t("admin.noActivityLogs")}</p>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {paginatedLogs.map(log => (
                <div key={log.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">{log.action}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                  </div>
                  {log.entity_type && <div className="text-sm text-muted-foreground">{t("admin.entity")}: {log.entity_type}</div>}
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader><TableRow><TableHead>{t("admin.action")}</TableHead><TableHead>{t("admin.entity")}</TableHead><TableHead>{t("admin.time")}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {paginatedLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                      <TableCell>{log.entity_type ? <span className="text-sm text-muted-foreground">{log.entity_type}</span> : <span className="text-sm text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {t("admin.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, logs.length)} {t("admin.of")} {logs.length} {t("admin.logs")}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem><PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                    <div className="hidden md:flex">
                      {getPageNumbers().map((page, index) => page === "ellipsis" ? <PaginationItem key={`ellipsis-${index}`}><PaginationEllipsis /></PaginationItem> : <PaginationItem key={page}><PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>)}
                    </div>
                    <PaginationItem className="md:hidden"><span className="text-sm">{currentPage} {t("admin.of")} {totalPages}</span></PaginationItem>
                    <PaginationItem><PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}