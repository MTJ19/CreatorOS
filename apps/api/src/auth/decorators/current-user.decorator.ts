import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { JwtPayload } from '../strategies/jwt.strategy';
import type { Request } from 'express';

/** Extracts the authenticated user's JWT payload from the request */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return request.user;
  },
);
