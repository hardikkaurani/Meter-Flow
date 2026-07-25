import { prisma } from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/auth.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  static async updateProfile(userId: string, input: UpdateProfileInput) {
    if (input.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: input.email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new BadRequestError('Email address is already in use by another account');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.email && { email: input.email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        orgId: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  static async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await comparePassword(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens on password change
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    return { message: 'Password updated successfully' };
  }
}
