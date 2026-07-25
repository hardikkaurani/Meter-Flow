import { prisma } from '../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { UserRole } from '@prisma/client';
import crypto from 'node:crypto';

export interface InviteMemberInput {
  email: string;
  role: UserRole;
}

export class OrgService {
  static async getOrganization(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        invitations: {
          where: { accepted: false, expiresAt: { gt: new Date() } },
          select: {
            id: true,
            email: true,
            role: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    return org;
  }

  static async updateOrganization(orgId: string, name: string) {
    const org = await prisma.organization.update({
      where: { id: orgId },
      data: { name },
    });

    return org;
  }

  static async inviteMember(orgId: string, input: InviteMemberInput) {
    const existingUser = await prisma.user.findFirst({
      where: { orgId, email: input.email },
    });

    if (existingUser) {
      throw new BadRequestError('User is already a member of this organization');
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitation = await prisma.invitation.create({
      data: {
        orgId,
        email: input.email,
        role: input.role,
        token: invitationToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      invitationId: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitationToken,
      expiresAt: invitation.expiresAt,
    };
  }

  static async joinOrganization(userId: string, invitationToken: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token: invitationToken },
    });

    if (!invitation || invitation.accepted || invitation.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired invitation token');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        orgId: invitation.orgId,
        role: invitation.role,
      },
      select: {
        id: true,
        email: true,
        orgId: true,
        role: true,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { accepted: true },
    });

    return updatedUser;
  }

  static async updateMemberRole(orgId: string, requesterRole: UserRole, targetUserId: string, newRole: UserRole) {
    if (requesterRole !== UserRole.owner) {
      throw new ForbiddenError('Only Organization Owners can modify member roles');
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, orgId },
    });

    if (!targetUser) {
      throw new NotFoundError('Target member not found in your organization');
    }

    if (targetUser.role === UserRole.owner) {
      throw new ForbiddenError('Cannot alter role of primary Organization Owner');
    }

    const updatedMember = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return updatedMember;
  }
}
