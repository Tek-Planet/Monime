import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, Building2, MapPin, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminType } from "@/hooks/admin/useAdminType";
import { useAdminBusinesses, useNGOsForFilter } from "@/hooks/admin/useAdminBusinesses";
import { BusinessLocationsMap } from "@/components/maps/BusinessLocationsMap";
import { AddressSearch } from "@/components/maps/AddressSearch";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
const ITEMS_PER_PAGE = 10;
export default function AllBusinesses() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { adminType, loading: adminLoading } = useAdminType();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [ngoFilter, setNgoFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const isSystemAdmin = adminType === "system_admin";
  const { data: ngosData = [] } = useNGOsForFilter();
  const { data, isLoading } = useAdminBusinesses({
    search: searchQuery,
    typeFilter,
    ngoFilter,
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
  });
  const businesses = data?.businesses || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  useEffect(() => {
    if (!adminLoading && !isSystemAdmin) {
      navigate("/admin");
    }
  }, [isSystemAdmin, adminLoading, navigate]);
  const handleViewDetails = (businessId: string) => {
    navigate(`/admin/businesses/${businessId}`);
  };
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 2) pages.push("ellipsis");
      if (currentPage !== 1 && currentPage !== totalPages) {
        pages.push(currentPage);
      }
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
    );
  }
  if (!isSystemAdmin) return null;
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8" />
        <h1 className="text-2xl md:text-3xl font-bold">{t("admin.allBusinesses")}</h1>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "map")} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              {t("admin.listView")}
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("admin.mapView")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="map" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.searchLocation")}</CardTitle>
              <div className="mt-4">
                <AddressSearch
                  onLocationSelect={(lat, lng, displayName) => {
                    setSearchedLocation({ lat, lng });
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <BusinessLocationsMap
                businesses={businesses}
                height="500px"
                onBusinessClick={handleViewDetails}
                searchedLocation={searchedLocation}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.businessDirectory")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">{t("admin.searchLabel")}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.searchBusinessPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-1 gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">{t("admin.typeLabel")}</label>
                    <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger><SelectValue placeholder={t("admin.allTypes")} /></SelectTrigger>
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
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">{t("admin.ngoLabel")}</label>
                    <Select value={ngoFilter} onValueChange={(v) => { setNgoFilter(v); setCurrentPage(1); }}>
                      <SelectTrigger><SelectValue placeholder={t("admin.allNGOs")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.allNGOs")}</SelectItem>
                        <SelectItem value="unassigned">{t("admin.unassigned")}</SelectItem>
                        {ngosData.map((ngo) => (
                          <SelectItem key={ngo.id} value={ngo.id}>
                            {ngo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : businesses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t("admin.noBusinessesFound")}</p>
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
                    <div className="mb-2">
                      {business.ngos ? (
                        <Badge variant="secondary">{business.ngos.name}</Badge>
                      ) : (
                        <Badge variant="outline">{t("admin.unassigned")}</Badge>
                      )}
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
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.name")}</TableHead>
                      <TableHead>{t("admin.type")}</TableHead>
                      <TableHead>{t("admin.ngo")}</TableHead>
                      <TableHead>{t("admin.contact")}</TableHead>
                      <TableHead>{t("admin.joined")}</TableHead>
                      <TableHead>{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map((business) => (
                      <TableRow key={business.id}>
                        <TableCell className="font-medium">{business.business_name}</TableCell>
                        <TableCell>
                          {business.business_type ? <Badge variant="outline">{business.business_type}</Badge> : "-"}
                        </TableCell>
                        <TableCell>
                          {business.ngos ? (
                            <Badge variant="secondary">{business.ngos.name}</Badge>
                          ) : (
                            <Badge variant="outline">{t("admin.unassigned")}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {business.email && <div>{business.email}</div>}
                            {business.phone && <div>{business.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(business.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="default" size="sm" onClick={() => handleViewDetails(business.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {t("admin.view")}
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
                    {t("admin.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} {t("admin.to")}{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} {t("admin.of")} {totalCount} {t("admin.businesses")}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      <div className="hidden md:flex">
                        {getPageNumbers().map((page, index) =>
                          page === "ellipsis" ? (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ),
                        )}
                      </div>
                      <PaginationItem className="md:hidden">
                        <span className="text-sm">
                          {currentPage} of {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
