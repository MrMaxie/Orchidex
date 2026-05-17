import {
  IconBell,
  IconCode,
  IconDatabase,
  IconGitBranch,
  IconHandClick,
  IconWebhook,
  type IconProps,
} from "@tabler/icons-react";
import type * as React from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CatalogDiagnostic, CatalogNode } from "@/features/workspace/types";

type CatalogIcon = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

const catalogIcons: Record<string, CatalogIcon> = {
  CRM: IconDatabase,
  Database: IconDatabase,
  Desk: IconHandClick,
  HTTP: IconWebhook,
  Logic: IconGitBranch,
  Slack: IconBell,
};

export function NodeCatalogDialog({
  catalog,
  diagnostics,
  isOpen,
  onAddNode,
  onOpenChange,
}: {
  catalog: CatalogNode[];
  diagnostics: CatalogDiagnostic[];
  isOpen: boolean;
  onAddNode: (node: CatalogNode) => void;
  onOpenChange: (isOpen: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>Add workflow block</DialogTitle>
          <DialogDescription>
            Search the node collection and add one block to the active graph.
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-none">
          <CommandInput placeholder="Search nodes by app, connector, or name..." />
          <CommandList className="max-h-[28rem]">
            <CommandEmpty>No matching nodes.</CommandEmpty>
            <CommandGroup heading="Node collection">
              {catalog.map((catalogNode) => {
                const Icon = catalogIcons[catalogNode.app] ?? IconCode;

                return (
                  <CommandItem
                    className="items-start"
                    key={catalogNode.id}
                    onSelect={() => onAddNode(catalogNode)}
                    value={`${catalogNode.app} ${catalogNode.connector} ${catalogNode.label}`}
                  >
                    <Icon
                      aria-hidden
                      className="mt-0.5 text-muted-foreground"
                      size={16}
                      stroke={1.7}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {catalogNode.label}
                        </span>
                        <span className="font-mono text-[0.625rem] text-muted-foreground">
                          {catalogNode.connector}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs/relaxed text-muted-foreground">
                        {catalogNode.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {catalogNode.capabilities.map((capability) => (
                          <span
                            className="rounded-sm border border-border/60 px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground"
                            key={capability}
                          >
                            {capability}
                          </span>
                        ))}
                        {renderSchemaHint("config", catalogNode.configSchemaHints)}
                        {renderSchemaHint("input", catalogNode.inputSchemaHints)}
                        {renderSchemaHint("output", catalogNode.outputSchemaHints)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground",
                      )}
                    >
                      {catalogNode.app}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {diagnostics.length > 0 ? (
              <CommandGroup heading="Catalog diagnostics">
                {diagnostics.map((diagnostic) => (
                  <div
                    className="flex flex-col gap-1 border-b border-border/40 px-2 py-2 text-xs last:border-b-0"
                    key={`${diagnostic.path}:${diagnostic.message}`}
                  >
                    <span className="font-medium text-foreground">
                      {diagnostic.nodeId ?? "Unresolved node manifest"}
                    </span>
                    <span className="font-mono text-[0.625rem] text-muted-foreground">
                      {diagnostic.path}
                    </span>
                    <span className="text-muted-foreground">
                      {diagnostic.message}
                    </span>
                  </div>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function renderSchemaHint(kind: string, values: string[]) {
  if (values.length === 0) {
    return null;
  }

  return (
    <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground">
      {kind}: {values.join(", ")}
    </span>
  );
}
