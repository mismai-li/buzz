import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { relayClient } from "@/shared/api/relayClient";
import { signRelayEvent } from "@/shared/api/tauri";
import type { RelayEvent } from "@/shared/api/types";

const FILE_FOLDER_KIND = 30078;
const FILE_FOLDER_TAG = "file-folder";
const FOLDER_QUERY_KEY_PREFIX = "channel-file-folders";

export type FileFolder = {
  /** The d-tag value (e.g. "files-abc123:q3-reports"). */
  dTag: string;
  /** Human-readable folder name. */
  name: string;
  /** Event IDs of files in this folder. */
  fileEventIds: string[];
  /** The raw relay event (for republishing updates). */
  event: RelayEvent;
};

function folderSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function folderDTag(channelId: string, slug: string): string {
  return `files-${channelId}:${slug}`;
}

function parseFolder(event: RelayEvent): FileFolder | null {
  const dTag = event.tags.find((t) => t[0] === "d")?.[1];
  const typeTag = event.tags.find((t) => t[0] === "t");
  if (!dTag || typeTag?.[1] !== FILE_FOLDER_TAG) return null;

  const name = event.tags.find((t) => t[0] === "name")?.[1] ?? "Untitled";
  const fileEventIds = event.tags
    .filter((t) => t[0] === "e")
    .map((t) => t[1])
    .filter(Boolean);

  return { dTag, name, fileEventIds, event };
}

function folderQueryKey(channelId: string) {
  return [FOLDER_QUERY_KEY_PREFIX, channelId] as const;
}

export function useFileFolders(
  channelId: string | null,
  currentPubkey?: string,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: folderQueryKey(channelId ?? ""),
    queryFn: async () => {
      if (!channelId || !currentPubkey) return [];
      const events = await relayClient.requestHistory({
        kinds: [FILE_FOLDER_KIND],
        authors: [currentPubkey],
        limit: 50,
      });
      return events
        .map(parseFolder)
        .filter(
          (f): f is FileFolder =>
            f !== null && f.dTag.startsWith(`files-${channelId}:`),
        );
    },
    enabled: !!channelId && !!currentPubkey,
    staleTime: 30_000,
  });

  const folders = query.data ?? [];

  /** Group file event IDs by folder dTag for fast lookup. */
  const fileFolderMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const folder of folders) {
      for (const eventId of folder.fileEventIds) {
        map.set(eventId, folder.dTag);
      }
    }
    return map;
  }, [folders]);

  const createFolder = useCallback(
    async (name: string): Promise<FileFolder | null> => {
      if (!channelId || !currentPubkey) return null;
      const slug = folderSlug(name);
      const dTag = folderDTag(channelId, slug);
      const event = await signRelayEvent({
        kind: FILE_FOLDER_KIND,
        content: "",
        tags: [
          ["d", dTag],
          ["t", FILE_FOLDER_TAG],
          ["name", name],
        ],
      });
      relayClient.publishEvent(event);
      await queryClient.invalidateQueries({
        queryKey: folderQueryKey(channelId),
      });
      return parseFolder(event);
    },
    [channelId, currentPubkey, queryClient],
  );

  const addFileToFolder = useCallback(
    async (folder: FileFolder, eventId: string) => {
      if (!currentPubkey) return;
      // Don't duplicate
      if (folder.fileEventIds.includes(eventId)) return;
      const newTags = [
        ...folder.event.tags.filter(
          (t) => t[0] !== "e" || t[1] !== eventId,
        ),
        ["e", eventId],
      ];
      const event = await signRelayEvent({
        kind: FILE_FOLDER_KIND,
        content: "",
        tags: newTags,
        createdAt: Math.floor(Date.now() / 1000),
      });
      relayClient.publishEvent(event);
      await queryClient.invalidateQueries({
        queryKey: folderQueryKey(channelId!),
      });
    },
    [channelId, currentPubkey, queryClient],
  );

  const removeFileFromFolder = useCallback(
    async (folder: FileFolder, eventId: string) => {
      if (!currentPubkey) return;
      const newTags = folder.event.tags.filter(
        (t) => !(t[0] === "e" && t[1] === eventId),
      );
      const event = await signRelayEvent({
        kind: FILE_FOLDER_KIND,
        content: "",
        tags: newTags,
        createdAt: Math.floor(Date.now() / 1000),
      });
      relayClient.publishEvent(event);
      await queryClient.invalidateQueries({
        queryKey: folderQueryKey(channelId!),
      });
    },
    [channelId, currentPubkey, queryClient],
  );

  const deleteFolder = useCallback(
    async (folder: FileFolder) => {
      if (!currentPubkey) return;
      // NIP-09 deletion: publish kind:5 referencing the folder event
      const event = await signRelayEvent({
        kind: 5,
        content: "deleting file folder",
        tags: [
          ["e", folder.event.id],
          ["k", String(FILE_FOLDER_KIND)],
        ],
      });
      relayClient.publishEvent(event);
      await queryClient.invalidateQueries({
        queryKey: folderQueryKey(channelId!),
      });
    },
    [channelId, currentPubkey, queryClient],
  );

  const renameFolder = useCallback(
    async (folder: FileFolder, newName: string) => {
      if (!channelId || !currentPubkey) return;
      const slug = folderSlug(newName);
      const newDTag = folderDTag(channelId, slug);

      // Replace d-tag and name, keep file refs
      const tags = folder.event.tags
        .filter((t) => t[0] !== "d" && t[0] !== "name")
        .concat([
          ["d", newDTag],
          ["name", newName],
        ]);

      const event = await signRelayEvent({
        kind: FILE_FOLDER_KIND,
        content: "",
        tags,
        createdAt: Math.floor(Date.now() / 1000),
      });
      relayClient.publishEvent(event);

      // If the d-tag changed, also delete the old event
      if (newDTag !== folder.dTag) {
        const deleteEvent = await signRelayEvent({
          kind: 5,
          content: "",
          tags: [
            ["e", folder.event.id],
            ["k", String(FILE_FOLDER_KIND)],
          ],
        });
        relayClient.publishEvent(deleteEvent);
      }

      await queryClient.invalidateQueries({
        queryKey: folderQueryKey(channelId),
      });
    },
    [channelId, currentPubkey, queryClient],
  );

  return {
    folders,
    fileFolderMap,
    isLoading: query.isPending,
    createFolder,
    addFileToFolder,
    removeFileFromFolder,
    deleteFolder,
    renameFolder,
  };
}
