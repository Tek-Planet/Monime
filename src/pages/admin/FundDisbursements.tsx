import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateDisbursementModal } from '@/components/admin/CreateDisbursementModal'
import { useAdminType } from '@/hooks/admin/useAdminType'
import { useAdminFundDisbursements, useUpdateDisbursementStatus } from '@/hooks/admin/useAdminFundDisbursements'
import { Plus, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { LeCurrency } from '@/components/ui/le-currency'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const ITEMS_PER_PAGE = 10

export default function FundDisbursements() {
  const { t } = useLanguage()
  const { adminType, ngoId, loading: adminLoading } = useAdminType()
  const navigate = useNavigate()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: disbursements = [], isLoading } = useAdminFundDisbursements(ngoId)
  const updateStatusMutation = useUpdateDisbursementStatus()

  const filteredDisbursements = statusFilter === 'all' 
    ? disbursements 
    : disbursements.filter(d => d.status === statusFilter)

  const totalPages = Math.ceil(filteredDisbursements.length / ITEMS_PER_PAGE)

  const paginatedDisbursements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredDisbursements.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredDisbursements, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("ellipsis")
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis")
      pages.push(totalPages)
    }
    return pages
  }

  if (adminLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (adminType === 'none') {
    navigate('/admin')
    return null
  }

  const stats = {
    total: disbursements.reduce((sum, d) => sum + Number(d.amount), 0),
    disbursed: disbursements.filter(d => d.status === 'disbursed' || d.status === 'completed').reduce((sum, d) => sum + Number(d.amount), 0),
    pending: disbursements.filter(d => d.status === 'pending' || d.status === 'approved').reduce((sum, d) => sum + Number(d.amount), 0),
    count: disbursements.length,
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline', approved: 'secondary', disbursed: 'default', completed: 'default', cancelled: 'destructive',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      grant: 'default', loan: 'secondary', credit: 'outline',
    }
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>
  }

  const handleStatusUpdate = (disbursementId: string, newStatus: any) => {
    updateStatusMutation.mutate({ disbursementId, status: newStatus })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("admin.fundDisbursements")}</h1>
          <p className="text-muted-foreground">{t("admin.manageFundDistribution")}</p>
        </div>
        {adminType === 'ngo_admin' && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />{t("admin.newDisbursement")}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{t("admin.totalAllocated")}</CardTitle><LeCurrency className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Le {stats.total.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{t("admin.disbursed")}</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Le {stats.disbursed.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{t("admin.pending")}</CardTitle><XCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Le {stats.pending.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{t("admin.totalCount")}</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.count}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div><CardTitle>{t("admin.disbursementRecords")}</CardTitle><CardDescription>{t("admin.viewManageDisbursements")}</CardDescription></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder={t("admin.filterByStatus")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allStatus")}</SelectItem>
                <SelectItem value="pending">{t("admin.pending")}</SelectItem>
                <SelectItem value="approved">{t("admin.approved")}</SelectItem>
                <SelectItem value="disbursed">{t("admin.disbursed")}</SelectItem>
                <SelectItem value="completed">{t("admin.completed")}</SelectItem>
                <SelectItem value="cancelled">{t("admin.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filteredDisbursements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><p>{t("admin.noDisbursementsFound")}</p></div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3">
                {paginatedDisbursements.map((disbursement) => (
                  <div key={disbursement.id} className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{disbursement.businesses?.business_name}</div>
                      {getStatusBadge(disbursement.status)}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold">Le {Number(disbursement.amount).toLocaleString()}</span>
                      {getTypeBadge(disbursement.disbursement_type)}
                    </div>
                    {disbursement.purpose && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{disbursement.purpose}</p>
                    )}
                    <div className="text-xs text-muted-foreground mb-3">
                      {format(new Date(disbursement.disbursement_date), 'MMM d, yyyy')}
                    </div>
                    {disbursement.status === 'pending' && (
                      <Button size="sm" variant="outline" className="w-full" onClick={() => handleStatusUpdate(disbursement.id, 'approved')} disabled={updateStatusMutation.isPending}>
                        {t("admin.approve")}
                      </Button>
                    )}
                    {disbursement.status === 'approved' && (
                      <Button size="sm" className="w-full" onClick={() => handleStatusUpdate(disbursement.id, 'disbursed')} disabled={updateStatusMutation.isPending}>
                        {t("admin.disburse")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>{t("admin.business")}</TableHead><TableHead>{t("admin.amount")}</TableHead><TableHead>{t("admin.type")}</TableHead><TableHead>{t("admin.purpose")}</TableHead><TableHead>{t("admin.date")}</TableHead><TableHead>{t("admin.status")}</TableHead><TableHead>{t("admin.actions")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedDisbursements.map((disbursement) => (
                      <TableRow key={disbursement.id}>
                        <TableCell className="font-medium">{disbursement.businesses?.business_name}</TableCell>
                        <TableCell>Le {Number(disbursement.amount).toLocaleString()}</TableCell>
                        <TableCell>{getTypeBadge(disbursement.disbursement_type)}</TableCell>
                        <TableCell className="max-w-xs truncate">{disbursement.purpose}</TableCell>
                        <TableCell>{format(new Date(disbursement.disbursement_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{getStatusBadge(disbursement.status)}</TableCell>
                        <TableCell>
                          {disbursement.status === 'pending' && <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(disbursement.id, 'approved')} disabled={updateStatusMutation.isPending}>{t("admin.approve")}</Button>}
                          {disbursement.status === 'approved' && <Button size="sm" onClick={() => handleStatusUpdate(disbursement.id, 'disbursed')} disabled={updateStatusMutation.isPending}>{t("admin.disburse")}</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t("admin.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredDisbursements.length)} {t("admin.of")} {filteredDisbursements.length} {t("admin.disbursements")}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                      <div className="hidden md:flex">
                        {getPageNumbers().map((page, index) =>
                          page === "ellipsis" ? (
                            <PaginationItem key={`ellipsis-${index}`}><PaginationEllipsis /></PaginationItem>
                          ) : (
                            <PaginationItem key={page}><PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>
                          )
                        )}
                      </div>
                      <PaginationItem className="md:hidden"><span className="text-sm">{currentPage} {t("admin.of")} {totalPages}</span></PaginationItem>
                      <PaginationItem>
                        <PaginationNext onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {adminType === 'ngo_admin' && ngoId && (
        <CreateDisbursementModal open={createModalOpen} onOpenChange={setCreateModalOpen} ngoId={ngoId} onSuccess={() => {}} />
      )}
    </div>
  )
}