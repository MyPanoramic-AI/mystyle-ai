/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Link2, Mail, X } from 'lucide-react';
import { AccountApiError, accountApi, type FamilyLinkInvite } from '../../services/accountApi';
import type { FamilyRelationship } from '../../types/family';

const RELATIONSHIPS: FamilyRelationship[] = [
  'Partner / Spouse',
  'Parent',
  'Son',
  'Daughter',
  'Other Family Member',
];

interface FamilyLinkInvitePanelProps {
  enabled: boolean;
  onLinked?: () => void;
}

export const FamilyLinkInvitePanel: React.FC<FamilyLinkInvitePanelProps> = ({
  enabled,
  onLinked,
}) => {
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<FamilyRelationship>('Partner / Spouse');
  const [outgoing, setOutgoing] = useState<FamilyLinkInvite[]>([]);
  const [incoming, setIncoming] = useState<FamilyLinkInvite[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    const listed = await accountApi.familyLinkInvites();
    setOutgoing(listed.outgoing.filter((item) => item.status === 'pending'));
    setIncoming(listed.incoming);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    reload().catch((error: unknown) => {
      if (cancelled) return;
      setMessage(error instanceof AccountApiError ? error.message : 'Family link requests could not be loaded.');
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, reload]);

  if (!enabled) return null;

  const handleSend = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const created = await accountApi.createFamilyLinkInvite({
        email: email.trim(),
        relationshipLabel: relationship,
      });
      setEmail('');
      setMessage(created.note);
      await reload();
    } catch (error) {
      setMessage(error instanceof AccountApiError ? error.message : 'Invite could not be sent.');
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async (id: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await accountApi.acceptFamilyLinkInvite(id);
      setMessage('Family link accepted. Their profile is now in your family list.');
      await reload();
      onLinked?.();
    } catch (error) {
      setMessage(error instanceof AccountApiError ? error.message : 'Invite could not be accepted.');
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async (id: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await accountApi.declineFamilyLinkInvite(id);
      setMessage('Family link request declined.');
      await reload();
    } catch (error) {
      setMessage(error instanceof AccountApiError ? error.message : 'Invite could not be declined.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (id: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await accountApi.cancelFamilyLinkInvite(id);
      setMessage('Family link request cancelled.');
      await reload();
    } catch (error) {
      setMessage(error instanceof AccountApiError ? error.message : 'Invite could not be cancelled.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#242326]/8 bg-[#F6F2EC]/50 p-4 space-y-4">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#9C6A61]/15 text-[#9C6A61] flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B49361]">Link by email</p>
          <p className="text-xs text-[#5C585E] leading-relaxed">
            Invite another adult MyStyle account. They can accept or decline the request when signed in.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Mail className="w-3.5 h-3.5 text-[#5C585E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="family@example.com"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-sm"
            autoComplete="email"
          />
        </div>
        <select
          value={relationship}
          onChange={(event) => setRelationship(event.target.value as FamilyRelationship)}
          className="px-3 py-2.5 rounded-xl bg-white border border-[#242326]/15 text-xs text-[#242326]"
        >
          {RELATIONSHIPS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !email.trim()}
          onClick={() => { void handleSend(); }}
          className="px-4 py-2.5 rounded-xl bg-[#9C6A61] hover:bg-[#8A5B53] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
        >
          Send request
        </button>
      </div>

      {message && (
        <p className="text-[11px] text-[#5C585E] leading-relaxed" role="status">{message}</p>
      )}

      {incoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5C585E]">Incoming requests</p>
          {incoming.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-[#242326]/8"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#242326] truncate">
                  {invite.fromDisplayName || invite.fromEmail || 'Family member'}
                </p>
                <p className="text-[11px] text-[#5C585E] truncate">
                  {invite.fromEmail}
                  {invite.relationshipLabel ? ` · ${invite.relationshipLabel}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { void handleAccept(invite.id); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#242326] text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { void handleDecline(invite.id); }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#242326]/15 text-[#5C585E] text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5C585E]">Pending invitations</p>
          {outgoing.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-[#242326]/8"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#242326] truncate">{invite.toEmail}</p>
                <p className="text-[11px] text-[#5C585E]">
                  Waiting for response
                  {invite.relationshipLabel ? ` · ${invite.relationshipLabel}` : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => { void handleCancel(invite.id); }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#9C6A61] hover:text-[#794E46] disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
