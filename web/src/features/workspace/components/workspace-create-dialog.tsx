import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type CreateDialogMode = "project" | "workflow";

export function WorkspaceCreateDialog({
  mode,
  onCreateProject,
  onCreateWorkflow,
  onOpenChange,
  open,
  projectId,
}: {
  mode: CreateDialogMode;
  onCreateProject: (name: string, cwd: string) => void;
  onCreateWorkflow: (projectId: string, name: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string | null;
}) {
  const [name, setName] = useState("");
  const [cwd, setCwd] = useState(".");
  const isProject = mode === "project";
  const canSubmit = name.trim().length > 0 && (isProject || Boolean(projectId));

  useEffect(() => {
    if (!open) {
      setName("");
      setCwd(".");
    }
  }, [open]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isProject ? "New project" : "New workflow"}</DialogTitle>
          <DialogDescription>
            {isProject ? "Create a workspace project." : "Create a workflow graph."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) {
              return;
            }

            if (isProject) {
              onCreateProject(name.trim(), cwd.trim() || ".");
            } else if (projectId) {
              onCreateWorkflow(projectId, name.trim());
            }
            onOpenChange(false);
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="workspace-create-name">Name</FieldLabel>
              <Input
                autoFocus
                id="workspace-create-name"
                onChange={(event) => setName(event.currentTarget.value)}
                value={name}
              />
            </Field>
            {isProject ? (
              <Field>
                <FieldLabel htmlFor="workspace-create-cwd">Working directory</FieldLabel>
                <Input
                  id="workspace-create-cwd"
                  onChange={(event) => setCwd(event.currentTarget.value)}
                  value={cwd}
                />
              </Field>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button disabled={!canSubmit} type="submit">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
