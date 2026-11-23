import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UnauthenticatedError } from '../../domain/auth-errors';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthenticatedError('Missing or malformed authorization header');
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new UnauthenticatedError('Missing access token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      // Attach user payload to request
      (request as Request & { user: JwtPayload }).user = payload;
      return true;
    } catch {
      throw new UnauthenticatedError('Invalid or expired access token');
    }
  }
}
