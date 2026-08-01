import {
  FileIcon,
  ImageIcon,
  VideoIcon,
  Download,
  ExternalLink,
} from "lucide-react";
import type { ChannelFile } from "./useChannelFiles";

/** Human-friendly file size formatting. */
function formatSize(bytes: number | undefined): string {
  if (bytes == null || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Short relative timestamp (e.g. "Aug 1", "2d ago"). */
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

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/"))
    return <ImageIcon className="h-5 w-5" />;
  if (mimeType.startsWith("video/"))
    return <VideoIcon className="h-5 w-5" />;
  return <FileIcon className="h-5 w-5" />;
}

export type FileCardProps = {
  file: ChannelFile;
  senderName?: string;
};

export function FileCard({ file, senderName }: FileCardProps) {
  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");
  const filename = file.filename ?? file.rawUrl.split("/").pop() ?? "file";

  return (
    <a
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
      download={filename}
      href={file.url}
      rel="noreferrer"
      target="_blank"
    >
      {/* Thumbnail area */}
      {isImage ? (
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img
            alt={filename}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            src={file.url}
          />
        </div>
      ) : isVideo ? (
        <div className="flex aspect-square w-full items-center justify-center bg-muted">
          {file.thumb ? (
            <img
              alt={filename}
              className="h-full w-full object-cover opacity-60"
              loading="lazy"
              src={file.thumb}
            />
          ) : null}
          <VideoIcon className="absolute h-10 w-10 text-white opacity-80" />
        </div>
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-muted">
          {fileIcon(file.mimeType)}
        </div>
      )}

      {/* Info overlay */}
      <div className="flex flex-col gap-0.5 p-3">
        <div className="flex items-start justify-between gap-1">
          <span
            className="line-clamp-2 text-sm font-medium leading-tight break-all"
            title={filename}
          >
            {filename}
          </span>
          <Download className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{fileTypeLabel(file.mimeType)}</span>
          <span aria-hidden="true">·</span>
          {file.size != null ? (
            <>
              <span>{formatSize(file.size)}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span>{formatDate(file.createdAt)}</span>
          {senderName ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{senderName}</span>
            </>
          ) : null}
        </div>
      </div>
    </a>
  );
}

export function FileCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-square w-full bg-muted" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}
