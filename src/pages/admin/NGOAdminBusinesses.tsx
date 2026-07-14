import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminType } from '@/hooks/useAdminType'
import { useNGOBusinessesPaginated } from '@/hooks/admin/useAdminNGOs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Search, Eye } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'

const ITEMS_PER_PAGE = 10

export default function NGOAdminBusinesses() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { adminType, ngoId, loading: adminLoading } = useAdminType()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  
  const isNGOAdmin = adminType === 'ngo_admin'

  const { data, isLoading } = useNGOBusinessesPaginated({
    ngoId: ngoId || '',
    search: searchQuery,
    typeFilter,
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
  })

  const businesses = data?.businesses || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  useEffect(() => {
    if (!adminLoading && !isNGOAdmin) {
      navigate('/admin')
    }
  }, [isNGOAdmin, adminLoading, navigate])

  const handleViewDetails = (businessId: string) => {
    navigate(`/admin/businesses/${businessId}`)
  }

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 2) pages.push("ellipsis");
      if (currentPage !== 1 && currentPage !== totalPages) pages.push(currentPage);
      if (currentPage < totalPages - 1) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  if (adminLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!isNGOAdmin) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{t("admin.partnerBusinesses")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.businesses")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t("admin.searchLabel")}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.searchBusinessPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">{t("common.type")}</label>
              <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setCurrentPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allTypes")}</SelectItem>
                  <SelectItem value="retail">{t("admin.retail")}</SelectItem>
                  <SelectItem value="wholesale">{t("admin.wholesale")}</SelectItem>
                  <SelectItem value="service">{t("admin.service")}</SelectItem>
                  <SelectItem value="manufacturing">{t("admin.manufacturing")}</SelectItem>
                  <SelectItem value="other">{t("admin.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : businesses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchQuery || typeFilter !== 'all' 
                ? t("admin.noBusinessesMatchingFilters")
                : t("admin.noBusinessesAssignedToNgo")}
            </p>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="border border-border rounded-lg p-4 bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleViewDetails(business.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-primary">{business.business_name}</div>
                      {business.business_type && <Badge variant="outline">{business.business_type}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {business.email && <div className="break-all">{business.email}</div>}
                      {business.phone && <div>{business.phone}</div>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("admin.joined")}: {new Date(business.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("admin.contact")}</TableHead>
                      <TableHead>{t("admin.joined")}</TableHead>
                      <TableHead>{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map((business) => (
                      <TableRow key={business.id}>
                        <TableCell className="font-medium">{business.business_name}</TableCell>
                        <TableCell>
                          {business.business_type ? <Badge variant="outline">{business.business_type}</Badge> : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {business.email && <div>{business.email}</div>}
                            {business.phone && <div>{business.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(business.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(business.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {t("common.view")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {t("admin.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} {t("common.to")}{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} {t("admin.of")} {totalCount} {t("admin.businesses").toLowerCase()}
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
                            <PaginationItem key={page}>
                              <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>
                            </PaginationItem>
                          )
                        )}
                      </div>
                      <PaginationItem className="md:hidden">
                        <span className="text-sm">{currentPage} {t("admin.of")} {totalPages}</span>
                      </PaginationItem>
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
    </div>
  )
}
