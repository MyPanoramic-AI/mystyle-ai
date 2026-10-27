import assert from 'node:assert/strict';
import test from 'node:test';
import { authHeaders, register, startApi } from './harness.js';

test('family link invites can be sent, accepted, and declined', async () => {
  const api = await startApi({
    emailCaptureEnabled: true,
    appPublicUrl: 'https://mystyle.example',
    smtp: null,
  });
  try {
    const nikkie = await register(api.base, 'nikkie-link@example.com');
    const partner = await register(api.base, 'partner-link@example.com');
    const nikkieHeaders = authHeaders(nikkie.cookie, nikkie.body.csrfToken);
    const partnerHeaders = authHeaders(partner.cookie, partner.body.csrfToken);

    await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers: nikkieHeaders,
      body: JSON.stringify({ displayName: 'Nikkie', styles: ['classic'], sizes: { tops: 'M' }, budgetTier: '600-1000' }),
    });
    await fetch(`${api.base}/api/profile`, {
      method: 'PUT',
      headers: partnerHeaders,
      body: JSON.stringify({ displayName: 'Alex', styles: ['classic'], sizes: { tops: 'L' }, budgetTier: '600-1000' }),
    });

    const selfInvite = await fetch(`${api.base}/api/family/link-invites`, {
      method: 'POST',
      headers: nikkieHeaders,
      body: JSON.stringify({ email: 'nikkie-link@example.com' }),
    });
    assert.equal(selfInvite.status, 400);

    const invited = await fetch(`${api.base}/api/family/link-invites`, {
      method: 'POST',
      headers: nikkieHeaders,
      body: JSON.stringify({ email: 'partner-link@example.com', relationshipLabel: 'Partner / Spouse' }),
    });
    const inviteBody = await invited.json() as { id: string; status: string; toUserId: string | null; emailed?: boolean };
    assert.equal(invited.status, 201);
    assert.equal(inviteBody.status, 'pending');
    assert.equal(inviteBody.emailed, true);
    assert.ok(inviteBody.toUserId);

    const captured = api.db.prepare(
      `SELECT kind, recipient, subject FROM transactional_email_capture
       WHERE kind = 'family_link_invite' AND lower(recipient) = ? LIMIT 1`,
    ).get('partner-link@example.com') as { kind: string; recipient: string; subject: string } | undefined;
    assert.ok(captured);
    assert.match(captured.subject, /family link/i);

    const duplicate = await fetch(`${api.base}/api/family/link-invites`, {
      method: 'POST',
      headers: nikkieHeaders,
      body: JSON.stringify({ email: 'partner-link@example.com' }),
    });
    assert.equal(duplicate.status, 409);

    const partnerInbox = await fetch(`${api.base}/api/family/link-invites`, { headers: { cookie: partner.cookie } });
    const partnerListed = await partnerInbox.json() as { incoming: { id: string; fromDisplayName: string | null }[]; outgoing: unknown[] };
    assert.equal(partnerInbox.status, 200);
    assert.equal(partnerListed.incoming.length, 1);
    assert.equal(partnerListed.incoming[0]?.id, inviteBody.id);
    assert.equal(partnerListed.incoming[0]?.fromDisplayName, 'Nikkie');

    const declinedOther = await fetch(`${api.base}/api/family/link-invites`, {
      method: 'POST',
      headers: nikkieHeaders,
      body: JSON.stringify({ email: 'other-link@example.com', relationshipLabel: 'Parent' }),
    });
    const otherInvite = await declinedOther.json() as { id: string; toUserId: string | null };
    assert.equal(declinedOther.status, 201);
    // Unknown email stays pending without confirming existence.
    assert.equal(otherInvite.toUserId, null);

    const stranger = await register(api.base, 'other-link@example.com');
    const strangerHeaders = authHeaders(stranger.cookie, stranger.body.csrfToken);
    const strangerInbox = await fetch(`${api.base}/api/family/link-invites`, { headers: { cookie: stranger.cookie } });
    const strangerListed = await strangerInbox.json() as { incoming: { id: string }[] };
    assert.equal(strangerListed.incoming.some((item) => item.id === otherInvite.id), true);

    const decline = await fetch(`${api.base}/api/family/link-invites/${otherInvite.id}/decline`, {
      method: 'POST',
      headers: strangerHeaders,
    });
    assert.equal(decline.status, 200);
    assert.equal((await decline.json() as { status: string }).status, 'declined');

    const accept = await fetch(`${api.base}/api/family/link-invites/${inviteBody.id}/accept`, {
      method: 'POST',
      headers: partnerHeaders,
    });
    assert.equal(accept.status, 200);
    assert.equal((await accept.json() as { status: string }).status, 'accepted');

    const nikkieFamily = await fetch(`${api.base}/api/family`, { headers: { cookie: nikkie.cookie } });
    const nikkieMembers = await nikkieFamily.json() as { members: { displayName: string; linkedUserId: string | null; linkSource: string }[] };
    assert.equal(nikkieMembers.members.length, 1);
    assert.equal(nikkieMembers.members[0]?.displayName, 'Alex');
    assert.equal(nikkieMembers.members[0]?.linkSource, 'account_link');
    assert.ok(nikkieMembers.members[0]?.linkedUserId);

    const partnerFamily = await fetch(`${api.base}/api/family`, { headers: { cookie: partner.cookie } });
    const partnerMembers = await partnerFamily.json() as { members: { displayName: string; linkedUserId: string | null }[] };
    assert.equal(partnerMembers.members.length, 1);
    assert.equal(partnerMembers.members[0]?.displayName, 'Nikkie');
  } finally {
    await api.close();
  }
});
