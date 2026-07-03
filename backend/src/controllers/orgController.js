// HTTP layer for org membership. Callers are already authenticated; orgId comes
// from the token so members can only ever touch their own org.
import * as orgService from '../services/orgService.js';

export async function listMembers(req, res) {
  const members = await orgService.listMembers(req.auth.orgId);
  res.json({ members });
}

export async function addMember(req, res) {
  const member = await orgService.addMember(req.auth.orgId, req.body);
  res.status(201).json({ member });
}

export async function removeMember(req, res) {
  await orgService.removeMember(req.auth.orgId, req.params.userId, req.auth.userId);
  res.status(204).end();
}
