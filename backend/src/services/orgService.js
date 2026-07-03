// Org membership. No email delivery in this build — an owner/admin adds a member
// directly with an initial password, which the member can use to log in.
import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function listMembers(orgId) {
  const users = await prisma.user.findMany({
    where: { orgId },
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return users;
}

export async function addMember(orgId, { email, password, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'Email already registered');
  if (role === 'owner') throw new HttpError(400, 'Cannot add a second owner');

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { orgId, email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  return user;
}

export async function removeMember(orgId, userId, requesterId) {
  if (userId === requesterId) throw new HttpError(400, 'You cannot remove yourself');
  const user = await prisma.user.findFirst({ where: { id: userId, orgId } });
  if (!user) throw new HttpError(404, 'Member not found');
  if (user.role === 'owner') throw new HttpError(400, 'Cannot remove the org owner');
  await prisma.user.delete({ where: { id: userId } });
}
