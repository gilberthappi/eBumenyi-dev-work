import httpClient from './httpClient';
import {
  ICHOGroup,
  ICHOGroupMember,
  ICHOGroupInvitation,
  ICHOGroupMonitoring,
  IStudentSearchResult,
} from '@/types';

// ─── CHO: own group ───────────────────────────────────────────────────────────

export const getMyGroup = async (): Promise<ICHOGroup> => {
  const response = await httpClient.get('/cho-groups/mine');
  return (response as any).data.data;
};

export const getMyGroupMembers = async (): Promise<ICHOGroupMember[]> => {
  const response = await httpClient.get('/cho-groups/mine/members');
  return (response as any).data.data;
};

export const getGroupMonitoring = async (): Promise<ICHOGroupMonitoring> => {
  const response = await httpClient.get('/cho-groups/mine/monitoring');
  return (response as any).data.data;
};

export const inviteMember = async (
  targetStudentId: string,
): Promise<ICHOGroupInvitation> => {
  const response = await httpClient.post('/cho-groups/mine/invitations', {
    targetStudentId,
  });
  return (response as any).data.data;
};

// ─── CHW: invitations ─────────────────────────────────────────────────────────

export const getMyInvitations = async (): Promise<ICHOGroupInvitation[]> => {
  const response = await httpClient.get('/cho-groups/invitations/mine');
  return (response as any).data.data;
};

export const respondToInvitation = async (
  invitationId: string,
  accept: boolean,
): Promise<any> => {
  const response = await httpClient.patch(
    `/cho-groups/invitations/${invitationId}`,
    { accept },
  );
  return (response as any).data;
};

// ─── Student search for invite screen ────────────────────────────────────────

export const searchStudentsForInvite = async (
  query?: string,
): Promise<IStudentSearchResult[]> => {
  const params = query ? `?search=${encodeURIComponent(query)}` : '';
  const response = await httpClient.get(
    `/cho-groups/mine/invite-candidates${params}`,
  );
  return (response as any).data.data ?? [];
};
