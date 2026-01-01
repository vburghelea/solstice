import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type DashboardShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharedWith: string;
  isOrgWide: boolean;
  onSharedWithChange: (value: string) => void;
  onOrgWideChange: (value: boolean) => void;
  onSave: () => void;
  isSaving?: boolean;
};

export function DashboardShareDialog({
  open,
  onOpenChange,
  sharedWith,
  isOrgWide,
  onSharedWithChange,
  onOrgWideChange,
  onSave,
  isSaving = false,
}: DashboardShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share dashboard</DialogTitle>
          <DialogDescription>Control who can access this dashboard.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dashboard-share-users">Share with users</Label>
            <Input
              id="dashboard-share-users"
              placeholder="user-id-1, user-id-2"
              value={sharedWith}
              onChange={(event) => onSharedWithChange(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Provide user IDs separated by commas.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="dashboard-share-org"
              checked={isOrgWide}
              onCheckedChange={(value) => onOrgWideChange(Boolean(value))}
            />
            <Label htmlFor="dashboard-share-org" className="text-sm">
              Share with entire organization
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            Save sharing settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
