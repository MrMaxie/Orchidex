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
import type { CatalogNode } from "@/features/workspace/types";

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
  isOpen,
  onAddNode,
  onOpenChange,
}: {
  catalog: CatalogNode[];
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
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
