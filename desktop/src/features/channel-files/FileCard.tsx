import { FileIcon, ImageIcon, VideoIcon, Download } from "lucide-react";
import type { ChannelFile } from "./useChannelFiles";

/** Human-friendly file size. */
function formatSize(bytes: number | undefined): string {
  if (bytes == null || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("zip") || mimeType.includes("tar")) return "Archive";
  if (
    mimeType.includes("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("xml")
  )
    return "Text";
  return "File";
}

function FileRowIcon({
  file,
}: {
  file: ChannelFile;
}) {
  if (file.mimeType.startsWith("image/")) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        <img
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          src={file.url}
        />
      </div>
    );
  }
  if (file.mimeType.startsWith("video/")) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <VideoIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
      <FileIcon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

export type FileRowProps = {
  file: ChannelFile;
  senderName?: string;
};

export function FileRow({ file, senderName }: FileRowProps) {
  const filename = file.filename ?? file.rawUrl.split("/").pop() ?? "file";

  return (
    <a
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
      download={filename}
      href={file.url}
      rel="noreferrer"
      target="_blank"
    >
      <FileRowIcon file={file} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{filename}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{fileTypeLabel(file.mimeType)}</span>
          {file.dim ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{file.dim}</span>
            </>
          ) : null}
          {file.size != null ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatSize(file.size)}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
        {senderName ? (
          <span className="max-w-[120px] truncate">{senderName}</span>
        ) : null}
        <span className="w-16 text-right">{formatDate(file.createdAt)}</span>
        <Download className="h-4 w-4 opacity-50" />
      </div>
    </a>
  );
}

export function FileRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-lg px-3 py-2.5">
      <div className="h-10 w-10 shrink-0 rounded-md bg-muted" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
      <div className="h-3 w-16 rounded bg-muted" />
    </div>
  );
}
