import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNGOs } from '@/hooks/useNGOs'
import { useNGOMembers } from '@/hooks/useNGOMembers'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Plus, UserCog, X } from 'lucide-react'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { useLanguage } from '@/contexts/LanguageContext'

const ITEMS_PER_PAGE = 10

interface NGOAdminManagementProps {
  ngoIdFilter?: string
}

export function NGOAdminManagement({ ngoIdFilter }: NGOAdminManagementProps) {
  const { t } = useLanguage()
  const { ngos } = useNGOs()
  const [selectedNgoId, setSelectedNgoId] = useState<string>('')
  const { members, loading, addMember, removeMember, refetch } = useNGOMembers(selectedNgoId)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchedUser, setSearchedUser] = useState<{ id: string; email: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserFirstName, setNewUserFirstName] = useState('')
  const [newUserLastName, setNewUserLastName] = useState('')

  useEffect(() => {
    if (ngoIdFilter) setSelectedNgoId(ngoIdFilter)
  }, [ngoIdFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedNgoId])

  const totalPages = Math.ceil(members.length / ITEMS_PER_PAGE)
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return members.slice(start, start + ITEMS_PER_PAGE)
  }, [members, currentPage])

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("ellipsis")
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("ellipsis")
      pages.push(totalPages)
    }
    return pages
  }

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error(t("admin.enterEmail"))
      return
    }
    setSearching(true)
    try {
      const { data, error } = await supabase.functions.invoke('search-user-by-email', { body: { email: searchEmail } })
      if (error || !data) {
        toast.error(t("admin.userNotFound"))
        setSearchedUser(null)
        return
      }
      setSearchedUser({ id: data.id, email: data.email })
      toast.success(t("admin.userFound"))
    } catch (error) {
      console.error('Error searching user:', error)
      toast.error(t("admin.userNotFound"))
      setSearchedUser(null)
    } finally {
      setSearching(false)
    }
  }

  const handleCreateAndAddAdmin = async () => {
    if (!selectedNgoId) { toast.error(t("admin.selectNgoRequired")); return }
    if (!newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName) {
      toast.error(t("admin.fillAllFields"))
      return
    }
    setCreating(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: { data: { first_name: newUserFirstName, last_name: newUserLastName } }
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')
      await addMember(selectedNgoId, authData.user.id, 'admin')
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: { email: newUserEmail, password: newUserPassword, firstName: newUserFirstName, lastName: newUserLastName, role: 'ngo_admin' }
        })
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
      }
      toast.success(t("admin.ngoAdminCreated"))
      setIsDialogOpen(false)
      setNewUserEmail(''); setNewUserPassword(''); setNewUserFirstName(''); setNewUserLastName('')
    } catch (error) {
      console.error('Error creating NGO admin:', error)
      toast.error(t("admin.failedCreateNgoAdmin"))
    } finally {
      setCreating(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!searchedUser || !selectedNgoId) {
      toast.error(t("admin.selectNgoAndUser"))
      return
    }
    try {
      await addMember(selectedNgoId, searchedUser.id, 'admin')
      toast.success(t("admin.ngoAdminAdded"))
      setIsDialogOpen(false); setSearchEmail(''); setSearchedUser(null)
    } catch (error) {
      console.error('Error adding NGO admin:', error)
      toast.error(t("admin.failedAddNgoAdmin"))
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId)
      toast.success(t("admin.memberRemoved"))
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error(t("admin.failedRemoveMember"))
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("admin.ngoAdminMgmt")}</CardTitle>
          <CardDescription>{t("admin.assignManageAdmins")}</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={ngos.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              {t("admin.addNgoAdmin")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("admin.addNgoAdminTitle")}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="ngo">{t("admin.selectNgo")} *</Label>
                <Select value={selectedNgoId} onValueChange={setSelectedNgoId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.chooseNgo")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ngos.map((ngo) => (
                      <SelectItem key={ngo.id} value={ngo.id}>{ngo.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="create">{t("admin.createNewUser")}</TabsTrigger>
                  <TabsTrigger value="search">{t("admin.addExistingUser")}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="create" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{t("admin.firstName")} *</Label>
                      <Input id="firstName" value={newUserFirstName} onChange={(e) => setNewUserFirstName(e.target.value)} placeholder="John" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t("admin.lastName")} *</Label>
                      <Input id="lastName" value={newUserLastName} onChange={(e) => setNewUserLastName(e.target.value)} placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newEmail">{t("common.email")} *</Label>
                    <Input id="newEmail" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="admin@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="password">{t("admin.password")} *</Label>
                    <Input id="password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button onClick={handleCreateAndAddAdmin} disabled={creating || !selectedNgoId || !newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName} className="w-full">
                    {creating ? t("admin.creating") : t("admin.createAndAddNgoAdmin")}
                  </Button>
                </TabsContent>

                <TabsContent value="search" className="space-y-4">
                  <div>
                    <Label htmlFor="email">{t("admin.userEmail")} *</Label>
                    <div className="flex gap-2">
                      <Input id="email" type="email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="user@example.com" />
                      <Button onClick={handleSearchUser} disabled={searching}>
                        {searching ? t("admin.searching") : t("admin.searchLabel")}
                      </Button>
                    </div>
                  </div>
                  {searchedUser && (
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium">{t("admin.userFound")}:</p>
                      <p className="text-sm text-muted-foreground">{searchedUser.email}</p>
                    </div>
                  )}
                  <Button onClick={handleAddAdmin} disabled={!searchedUser || !selectedNgoId} className="w-full">
                    {t("admin.addAsNgoAdmin")}
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!ngoIdFilter && (
          <div className="mb-4">
            <Label>{t("admin.filterByNgo")}</Label>
            <Select value={selectedNgoId} onValueChange={setSelectedNgoId}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.selectNgoToView")} />
              </SelectTrigger>
              <SelectContent>
                {ngos.map((ngo) => (
                  <SelectItem key={ngo.id} value={ngo.id}>{ngo.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!selectedNgoId ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("admin.selectNgoToViewMembers")}</p>
          </div>
        ) : loading ? (
          <p>{t("common.loading")}</p>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("admin.noMembersFound")}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.user")}</TableHead>
                  <TableHead>{t("admin.role")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("admin.added")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        {member.user_name && <div className="font-medium">{member.user_name}</div>}
                        <div className="text-sm text-muted-foreground">{member.user_email || t("admin.emailNotAvailable")}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {member.is_active && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {t("admin.showing")} {(currentPage - 1) * ITEMS_PER_PAGE + 1} {t("common.to")}{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, members.length)} {t("admin.of")} {members.length} {t("admin.members")}
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
  )
}
