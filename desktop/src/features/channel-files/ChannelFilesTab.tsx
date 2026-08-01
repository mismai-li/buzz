import { FileCard, FileCardSkeleton } from "./FileCard";
import type { ChannelFile } from "./useChannelFiles";

export type ChannelFilesTabProps = {
  files: ChannelFile[];
  isLoading: boolean;
  /** Optional map of pubkey -> display name for sender attribution. */
  senderNames?: Map<string, string>;
};

export function ChannelFilesTab({
  files,
  isLoading,
  senderNames,
}: ChannelFilesTabProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <FileCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex max-w-xs flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-muted p-4">
            <svg
              aria-hidden="true"
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">No files yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Files shared in this channel will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {files.map((file) => (
          <FileCard
            file={file}
            key={file.key}
            senderName={senderNames?.get(file.pubkey)}
          />
        ))}
      </div>
    </div>
  );
}
