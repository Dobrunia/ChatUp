import { defineStore } from 'pinia';
import { ref } from 'vue';
import { trpc } from '../api';
import { v4 as uuidv4 } from 'uuid';

export type AttachmentDraftState = 'SELECTED' | 'UPLOADING' | 'CONFIRMING' | 'READY' | 'FAILED';

export interface AttachmentDraft {
  id: string; // client-side local ID
  file: File;
  state: AttachmentDraftState;
  progress: number; // 0-100
  backendAttachmentId?: string; // set when READY
  error?: string;
}

export const useMediaStore = defineStore('media', () => {
  const drafts = ref<AttachmentDraft[]>([]);

  const addDraft = (file: File) => {
    const draft: AttachmentDraft = {
      id: uuidv4(),
      file,
      state: 'SELECTED',
      progress: 0
    };
    drafts.value.push(draft);
    // Auto-start upload for MVP
    uploadDraft(draft.id);
  };

  const removeDraft = (id: string) => {
    drafts.value = drafts.value.filter(d => d.id !== id);
  };

  const uploadDraft = async (id: string) => {
    const draft = drafts.value.find(d => d.id === id);
    if (!draft || draft.state !== 'SELECTED' && draft.state !== 'FAILED') return;

    try {
      draft.state = 'UPLOADING';
      draft.progress = 10;
      draft.error = undefined;

      const { uploadUrl, attachmentId } = await trpc.media.requestUploadUrl.mutate({
        mime: draft.file.type,
        size: draft.file.size
      });

      draft.progress = 50;

      // 2. Upload file directly to S3 (Mocking fetch PUT for now, as S3 is mock backend)
      await fetch(uploadUrl, {
        method: 'PUT',
        body: draft.file,
        headers: {
          'Content-Type': draft.file.type
        }
      });

      draft.progress = 90;
      draft.state = 'CONFIRMING';

      // 3. Confirm with backend
      await trpc.media.confirmUpload.mutate({ attachmentId });

      draft.state = 'READY';
      draft.progress = 100;
      draft.backendAttachmentId = attachmentId;

    } catch (err: unknown) {
      draft.state = 'FAILED';
      draft.error = err instanceof Error ? err.message : 'Upload failed';
      draft.progress = 0;
    }
  };

  const getReadyAttachmentIds = () => {
    return drafts.value
      .filter(d => d.state === 'READY' && d.backendAttachmentId)
      .map(d => d.backendAttachmentId!);
  };

  const clearReadyDrafts = () => {
    drafts.value = drafts.value.filter(d => d.state !== 'READY');
  };

  return {
    drafts,
    addDraft,
    removeDraft,
    uploadDraft,
    getReadyAttachmentIds,
    clearReadyDrafts
  };
});
