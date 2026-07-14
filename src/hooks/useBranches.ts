import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Branch {
  id: string;
  business_id: string;
  branch_name: string;
  branch_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_headquarters: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchInput {
  business_id: string;
  branch_name: string;
  branch_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_headquarters?: boolean;
}

export interface UpdateBranchInput {
  branch_name?: string;
  branch_code?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_headquarters?: boolean;
  is_active?: boolean;
}

async function fetchBranches(businessId: string): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("business_id", businessId)
    .order("is_headquarters", { ascending: false })
    .order("branch_name");

  if (error) {
    console.error("Error fetching branches:", error);
    throw error;
  }

  return (data || []) as Branch[];
}

export function useBranches(businessId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: branches = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["branches", businessId],
    queryFn: () => fetchBranches(businessId!),
    enabled: !!businessId && !!user,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const createBranchMutation = useMutation({
    mutationFn: async (input: CreateBranchInput) => {
      const { data, error } = await supabase
        .from("branches")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as Branch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches", businessId] });
      toast.success("Branch created successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating branch:", error);
      toast.error("Failed to create branch");
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({
      branchId,
      updates,
    }: {
      branchId: string;
      updates: UpdateBranchInput;
    }) => {
      const { data, error } = await supabase
        .from("branches")
        .update(updates)
        .eq("id", branchId)
        .select()
        .single();

      if (error) throw error;
      return data as Branch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches", businessId] });
      toast.success("Branch updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating branch:", error);
      toast.error("Failed to update branch");
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (branchId: string) => {
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", branchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches", businessId] });
      toast.success("Branch deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Error deleting branch:", error);
      toast.error("Failed to delete branch");
    },
  });

  return {
    branches,
    loading,
    refetch,
    createBranch: createBranchMutation.mutateAsync,
    updateBranch: updateBranchMutation.mutateAsync,
    deleteBranch: deleteBranchMutation.mutateAsync,
    isCreating: createBranchMutation.isPending,
    isUpdating: updateBranchMutation.isPending,
    isDeleting: deleteBranchMutation.isPending,
  };
}
