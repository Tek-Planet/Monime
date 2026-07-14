import { Building2, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useBranchContext } from "@/contexts/BranchContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function BranchSelector() {
  const { t } = useLanguage();
  const {
    accessibleBranches,
    selectedBranchId,
    selectedBranch,
    setSelectedBranchId,
    isBusinessOwner,
    isHqMember,
    loading,
    hasBranches,
    branchesEnabled,
  } = useBranchContext();

  const canSelectAll = isBusinessOwner || isHqMember;

  // When to show the selector:
  // 1. Feature must be enabled and not loading.
  // 2. User must have branches to choose from.
  //    - Owners/HQ can always choose ("All" + branches).
  //    - Regular members must have access to > 1 branch.
  const showSelector = branchesEnabled && !loading && hasBranches && (canSelectAll || accessibleBranches.length > 1);

  if (!showSelector) {
    return null;
  }

  const displayName = selectedBranch
    ? selectedBranch.branch_name
    : t("branches.allBranches");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 max-w-[180px] sm:max-w-[220px]"
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{displayName}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {t("branches.selectBranch")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* "All Branches" option for owners/HQ */}
        {canSelectAll && (
          <>
            <DropdownMenuItem
              onClick={() => setSelectedBranchId(null)}
              className={cn(
                "flex items-center justify-between",
                !selectedBranchId && "bg-accent"
              )}
            >
              <span>{t("branches.allBranches")}</span>
              {!selectedBranchId && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Individual accessible branches */}
        {accessibleBranches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => setSelectedBranchId(branch.id)}
            className={cn(
              "flex items-center justify-between",
              selectedBranchId === branch.id && "bg-accent"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">{branch.branch_name}</span>
              {branch.is_headquarters && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  HQ
                </Badge>
              )}
            </div>
            {selectedBranchId === branch.id && (
              <Check className="h-4 w-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
