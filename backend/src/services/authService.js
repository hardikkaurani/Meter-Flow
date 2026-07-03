// Auth/org lifecycle. Signup provisions an org + its first owner atomically.
import { prisma } from '../config/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';

function tokenFor(user) {
  return signToken({ sub: user.id, orgId: user.orgId, role: user.role });
}

function publicUser(user) {
  return { id: user.id, email: user.email, role: user.role, orgId: user.orgId };
}

// Create a brand-new org and its owner in one transaction.
export async function signup({ orgName, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'Email already registered');

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: orgName } });
    return tx.user.create({
      data: { orgId: org.id, email, passwordHash, role: 'owner' },
    });
  });

  return { user: publicUser(user), token: tokenFor(user) };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(401, 'Invalid credentials');

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');

  return { user: publicUser(user), token: tokenFor(user) };
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });
  if (!user) throw new HttpError(404, 'User not found');
  return { ...publicUser(user), organization: { id: user.organization.id, name: user.organization.name } };
}
