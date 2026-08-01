import { useMemo } from "react";
import { useChannelMessagesQuery } from "@/features/messages/hooks";
import { parseImetaTags } from "@/shared/ui/markdown/parseImeta";
import { rewriteRelayUrl } from "@/shared/lib/mediaUrl";
import type { Channel, RelayEvent } from "@/shared/api/types";
import type { ParsedImetaEntry } from "@/shared/ui/markdown/parseImeta";

export type ChannelFile = {
  /** Unique key (event id + url). */
  key: string;
  /** The relay-rewritten media URL for download/display. */
  url: string;
  /** Raw media URL from imeta. */
  rawUrl: string;
  /** MIME type (e.g. "image/png", "application/pdf"). */
  mimeType: string;
  /** File size in bytes, if available. */
  size: number | undefined;
  /** Original filename. */
  filename: string | undefined;
  /** SHA-256 hex, if available. */
  sha256: string | undefined;
  /** Thumbnail URL, if available. */
  thumb: string | undefined;
  /** Dimensions string (WxH), if available. */
  dim: string | undefined;
  /** Blurhash, if available. */
  blurhash: string | undefined;
  /** Sender pubkey. */
  pubkey: string;
  /** When the message was created (Unix seconds). */
  createdAt: number;
  /** The parent message event ID. */
  eventId: string;
  /** All parsed imeta fields. */
  imeta: ParsedImetaEntry;
};

/**
 * Extract all file-bearing events from a channel and parse their imeta tags
 * into a flat list of {@link ChannelFile} objects, ordered newest-first.
 *
 * Scans timeline messages for `imeta` tags; each media entry in an event
 * yields one ChannelFile entry.
 */
export function useChannelFiles(
  activeChannel: Channel | null,
): { files: ChannelFile[]; isLoading: boolean } {
  const messagesQuery = useChannelMessagesQuery(activeChannel);

  const files = useMemo(() => {
    const events: RelayEvent[] = messagesQuery.data ?? [];
    const result: ChannelFile[] = [];

    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];
      const tags = event.tags;
      if (!tags || tags.length === 0) continue;

      const entries = parseImetaTags(tags as string[][]);
      if (entries.size === 0) continue;

      for (const [, entry] of entries) {
        result.push({
          key: `${event.id}-${entry.url}`,
          url: rewriteRelayUrl(entry.url),
          rawUrl: entry.url,
          mimeType: entry.m ?? "application/octet-stream",
          size: entry.size != null && entry.size > 0 ? entry.size : undefined,
          filename: entry.filename,
          sha256: entry.x,
          thumb: entry.thumb ? rewriteRelayUrl(entry.thumb) : undefined,
          dim: entry.dim,
          blurhash: entry.blurhash,
          pubkey: event.pubkey,
          createdAt: event.created_at,
          eventId: event.id,
          imeta: entry,
        });
      }
    }

    return result;
  }, [messagesQuery.data]);

  return { files, isLoading: messagesQuery.isPending };
}
