import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useBranches, Branch } from "@/hooks/useBranches";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface BranchContextType {
  allBranches: Branch[];
  accessibleBranches: Branch[];
  selectedBranchId: string | null;
  selectedBranch: Branch | null;
  setSelectedBranchId: (branchId: string | null) => void;
  isBusinessOwner: boolean;
  isHqMember: boolean;
  loading: boolean;
  hasBranches: boolean;
  branchesEnabled: boolean;
  branchResolved: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

interface BranchProviderProps {
  children: ReactNode;
}

export function BranchProvider({ children }: BranchProviderProps) {
  const { user } = useAuth();
  const { business, loading: profileLoading } = useUserProfile();
  const { branches: allBranches, loading: branchesLoading } = useBranches(business?.id);
  
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [accessibleBranches, setAccessibleBranches] = useState<Branch[]>([]);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [isHqMember, setIsHqMember] = useState(false);
  const [branchResolved, setBranchResolved] = useState(false);

  const branchesEnabled = business?.branches_enabled ?? false;

  useEffect(() => {
    const checkUserBranchAccess = async () => {
      setBranchResolved(false);
      setIsBusinessOwner(false);
      setIsHqMember(false);
      setAccessibleBranches([]);
      
      if (!user || !business || !branchesEnabled || branchesLoading) {
        setBranchResolved(true);
        return;
      }

      if (business.owner_id === user.id) {
        setIsBusinessOwner(true);
        setAccessibleBranches(allBranches);
        const saved = localStorage.getItem(`selectedBranch_${business.id}`);
        setSelectedBranchId(saved === 'null' ? null : (saved ?? null));
        setBranchResolved(true);
        return;
      }

      const { data: memberships } = await supabase
        .from("organization_members")
        .select("branch_id")
        .eq("user_id", user.id)
        .eq("business_id", business.id)
        .eq("is_active", true);

        console.log(memberships,'membership')

      if (memberships && memberships.length > 0) {
        const assignedBranchIds = memberships.map(m => m.branch_id).filter(id => id !== null) as string[];
        console.log(assignedBranchIds,'assignedBranchIds')
        // **THE FIX**: Prioritize specific branch assignments. A user is only an HQ member
        // if they have a null branch_id and NO specific branch assignments.
        const hasSpecificAssignments = assignedBranchIds.length > 0;
        const hasHqAssignment = memberships.some(m => m.branch_id === null);

        if (hasSpecificAssignments) {
          setIsHqMember(false);
          const userBranches = allBranches.filter(b => assignedBranchIds.includes(b.id));
          setAccessibleBranches(userBranches);
          
          const saved = localStorage.getItem(`selectedBranch_${business.id}`);
          if (saved && userBranches.some(b => b.id === saved)) {
            setSelectedBranchId(saved);
          } else {
            setSelectedBranchId(userBranches[0]?.id ?? null);
          }
        } else if (hasHqAssignment) {
          setIsHqMember(true);
          setAccessibleBranches(allBranches);
          const saved = localStorage.getItem(`selectedBranch_${business.id}`);
          setSelectedBranchId(saved === 'null' ? null : (saved ?? null));
        } else {
          setAccessibleBranches([]);
          setSelectedBranchId(null);
        }
      } else {
        setAccessibleBranches([]);
        setSelectedBranchId(null);
      }
      
      setBranchResolved(true);
    };

    checkUserBranchAccess();

  }, [user, business, allBranches, branchesLoading, branchesEnabled]);


  const handleSetSelectedBranchId = useCallback((branchId: string | null) => {
    setSelectedBranchId(branchId);
    if (business?.id) {
        localStorage.setItem(`selectedBranch_${business.id}`, branchId === null ? "null" : branchId);
    }
  }, [business?.id]);
  
  const selectedBranch = allBranches.find((b) => b.id === selectedBranchId) || null;
  const hasBranches = branchesEnabled && allBranches.length > 0;

  const value: BranchContextType = {
    allBranches,
    accessibleBranches,
    selectedBranchId,
    selectedBranch,
    setSelectedBranchId: handleSetSelectedBranchId,
    isBusinessOwner,
    isHqMember,
    loading: profileLoading || branchesLoading || !branchResolved,
    hasBranches,
    branchesEnabled,
    branchResolved,
  };

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

export function useBranchContext() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranchContext must be used within a BranchProvider");
  }
  return context;
}
