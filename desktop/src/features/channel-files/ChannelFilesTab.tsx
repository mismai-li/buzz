import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { FileRow, FileRowSkeleton } from "./FileCard";
import {
  categorizeFile,
  sortFiles,
  type ChannelFile,
  type FileCategory,
  type FileSort,
} from "./useChannelFiles";
import { Button } from "@/shared/ui/button";

const CATEGORY_TABS: { value: FileCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS: { value: FileSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
];

export type ChannelFilesTabProps = {
  files: ChannelFile[];
  isLoading: boolean;
  senderNames?: Map<string, string>;
  senderAvatarUrls?: Map<string, string | null>;
  onJumpToMessage?: (eventId: string) => void;
};

export function ChannelFilesTab({
  files,
  isLoading,
  senderNames,
  senderAvatarUrls,
  onJumpToMessage,
}: ChannelFilesTabProps) {
  const [category, setCategory] = useState<FileCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<FileSort>("newest");

  const filtered = useMemo(() => {
    let result = files;

    if (category !== "all") {
      result = result.filter((f) => categorizeFile(f.mimeType) === category);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          (f.filename ?? "").toLowerCase().includes(q) ||
          (f.caption ?? "").toLowerCase().includes(q),
      );
    }

    return sortFiles(result, sort);
  }, [files, category, searchQuery, sort]);

  // Count per category for badge numbers
  const counts = useMemo(() => {
    const c: Record<FileCategory, number> = {
      all: files.length,
      image: 0,
      video: 0,
      document: 0,
      other: 0,
    };
    for (const f of files) {
      c[categorizeFile(f.mimeType)]++;
    }
    return c;
  }, [files]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <FileRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Filter tabs + search + sort toolbar */}
      <div className="shrink-0 space-y-2 border-b border-border px-4 pb-3 pt-3">
        {/* Category tabs */}
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          {CATEGORY_TABS.map((tab) => (
            <Button
              className="h-7 shrink-0 rounded-full px-3 text-xs"
              data-active={category === tab.value}
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              size="sm"
              variant={category === tab.value ? "secondary" : "ghost"}
            >
              {tab.label}
              {counts[tab.value] > 0 ? (
                <span className="ml-1 text-muted-foreground">
                  {counts[tab.value]}
                </span>
              ) : null}
            </Button>
          ))}
        </div>

        {/* Search + sort row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              type="text"
              value={searchQuery}
            />
            {searchQuery ? (
              <button
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
                type="button"
              >
                ×
              </button>
            ) : null}
          </div>

          <div className="relative">
            <select
              aria-label="Sort files"
              className="h-8 appearance-none rounded-md border border-border bg-background px-7 py-0 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              onChange={(e) => setSort(e.target.value as FileSort)}
              value={sort}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex max-w-xs flex-col items-center gap-2 text-center">
              <p className="text-sm font-medium">
                {files.length === 0 ? "No files yet" : "No matching files"}
              </p>
              <p className="text-xs text-muted-foreground">
                {files.length === 0
                  ? "Files shared in this channel will appear here."
                  : "Try a different filter or search term."}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border py-1">
            {filtered.map((file) => (
              <FileRow
                file={file}
                key={file.key}
                onJumpToMessage={onJumpToMessage}
                senderAvatarUrl={senderAvatarUrls?.get(file.pubkey) ?? null}
                senderName={senderNames?.get(file.pubkey)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
