import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAdminType } from '@/hooks/useAdminType'
import { useAdminNGO, useNGOBusinessCount, useNGOBusinesses } from '@/hooks/admin/useAdminNGOs'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Building2, Users, Edit } from 'lucide-react'
import { NGOAdminManagement } from '@/components/admin/NGOAdminManagement'
import { AssignBusinessModal } from '@/components/admin/AssignBusinessModal'
import { EditNGOModal } from '@/components/admin/EditNGOModal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { adminNGOsKeys } from '@/hooks/admin/useAdminNGOs'
import { useLanguage } from '@/contexts/LanguageContext'

export default function NGODetails() {
  const { t } = useLanguage()
  const { ngoId } = useParams<{ ngoId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { adminType, ngoId: userNgoId, loading: adminLoading } = useAdminType()
  const [assigningBusiness, setAssigningBusiness] = useState(false)
  const [editingNGO, setEditingNGO] = useState(false)
  
  const isSystemAdmin = adminType === 'system_admin'
  const isNGOAdmin = adminType === 'ngo_admin' && userNgoId === ngoId

  const { data: ngo, isLoading: ngoLoading } = useAdminNGO(ngoId)
  const { data: businessCount = 0 } = useNGOBusinessCount(ngoId)
  const { data: businesses = [], isLoading: businessesLoading } = useNGOBusinesses(ngoId, 3)

  useEffect(() => {
    if (!adminLoading && !isSystemAdmin && !isNGOAdmin) {
      navigate('/admin')
    }
  }, [isSystemAdmin, isNGOAdmin, adminLoading, navigate])

  const handleAssignSuccess = () => {
    queryClient.invalidateQueries({ queryKey: adminNGOsKeys.businesses(ngoId || '') })
    queryClient.invalidateQueries({ queryKey: adminNGOsKeys.businessCount(ngoId || '') })
  }

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: adminNGOsKeys.detail(ngoId || '') })
  }

  if (adminLoading || ngoLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!isSystemAdmin && !isNGOAdmin) return null
  if (!ngo) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/ngos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">{ngo.name}</h1>
              <Badge variant={ngo.is_active ? 'default' : 'secondary'}>
                {ngo.is_active ? t("common.active") : t("common.inactive")}
              </Badge>
            </div>
            {ngo.description && (
              <p className="text-muted-foreground mt-1">{ngo.description}</p>
            )}
          </div>
        </div>
        {isSystemAdmin && (
          <Button onClick={() => setEditingNGO(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t("admin.editNgo")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.contactInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ngo.contact_email && (
            <div>
              <span className="font-medium">{t("admin.email")}:</span> {ngo.contact_email}
            </div>
          )}
          {ngo.contact_phone && (
            <div>
              <span className="font-medium">{t("admin.phone")}:</span> {ngo.contact_phone}
            </div>
          )}
          {ngo.address && (
            <div>
              <span className="font-medium">{t("common.address")}:</span> {ngo.address}
            </div>
          )}
          <div>
            <span className="font-medium">{t("admin.created")}:</span>{' '}
            {new Date(ngo.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="admins" className="w-full">
        <TabsList>
          <TabsTrigger value="admins">
            <Users className="h-4 w-4 mr-2" />
            {t("admin.administrators")}
          </TabsTrigger>
          <TabsTrigger value="businesses">
            <Building2 className="h-4 w-4 mr-2" />
            {t("admin.businesses")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.ngoAdministrators")}</CardTitle>
              <CardDescription>{t("admin.manageAdminsForNGO")}</CardDescription>
            </CardHeader>
            <CardContent>
              <NGOAdminManagement ngoIdFilter={ngoId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="businesses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.partnerBusinesses")}</CardTitle>
                <CardDescription>
                  {businessCount} {businessCount === 1 ? t("admin.businessLinked") : t("admin.businessesLinked")} 
                </CardDescription>
              </div>
              {isSystemAdmin && (
                <Button onClick={() => setAssigningBusiness(true)}>
                  <Building2 className="h-4 w-4 mr-2" />
                  {t("admin.assignBusiness")}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {businessesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : businesses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("admin.noBusinessesAssigned")} {isSystemAdmin && t("admin.clickAssignBusiness")}
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.name")}</TableHead>
                        <TableHead>{t("common.type")}</TableHead>
                        <TableHead>{t("admin.contact")}</TableHead>
                        <TableHead>{t("admin.joined")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses.map((business) => (
                        <TableRow key={business.id}>
                          <TableCell className="font-medium">{business.business_name}</TableCell>
                          <TableCell>
                            {business.business_type ? (
                              <Badge variant="outline">{business.business_type}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {business.email && <div>{business.email}</div>}
                              {business.phone && <div>{business.phone}</div>}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(business.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => navigate(`/admin/ngos/${ngoId}/businesses`)}>
                      {t("admin.viewAll")} ({businessCount})
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editingNGO && (
        <EditNGOModal ngo={ngo} open={editingNGO} onOpenChange={setEditingNGO} onSuccess={handleEditSuccess} />
      )}

      {assigningBusiness && (
        <AssignBusinessModal ngoId={ngo.id} open={assigningBusiness} onOpenChange={setAssigningBusiness} onSuccess={handleAssignSuccess} />
      )}
    </div>
  )
}
