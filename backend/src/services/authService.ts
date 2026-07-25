import { prisma } from '../config/prisma.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
} from '../utils/auth.js';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { UserRole } from '@prisma/client';

export interface SignupInput {
  email: string;
  password: string;
  name?: string;
  orgName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  static async signup(input: SignupInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new BadRequestError('Email address is already registered');
    }

    const passwordHash = await hashPassword(input.password);

    // Create Organization and initial Owner User atomically
    const organization = await prisma.organization.create({
      data: {
        name: input.orgName,
        users: {
          create: {
            email: input.email,
            passwordHash,
            name: input.name,
            role: UserRole.owner,
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = organization.users[0];
    const payload = { userId: user.id, orgId: organization.id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshTokenString = generateRefreshTokenString();
    const tokenHash = hashToken(refreshTokenString);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: organization.id,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload = { userId: user.id, orgId: user.orgId, role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshTokenString = generateRefreshTokenString();
    const tokenHash = hashToken(refreshTokenString);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
      },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  static async refreshTokens(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Revoke old refresh token (single-use rotation)
    const newRefreshTokenString = generateRefreshTokenString();
    const newTokenHash = hashToken(newRefreshTokenString);

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revoked: true,
        replacedByToken: newTokenHash,
      },
    });

    // Create new refresh token
    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const payload = {
      userId: storedToken.user.id,
      orgId: storedToken.user.orgId,
      role: storedToken.user.role,
      email: storedToken.user.email,
    };

    const newAccessToken = generateAccessToken(payload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenString,
    };
  }

  static async logout(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
