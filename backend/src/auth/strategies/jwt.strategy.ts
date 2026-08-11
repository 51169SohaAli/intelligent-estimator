import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sprintflow_fallback_secret_key',
    });
  }

  // Inside src/auth/strategies/jwt.strategy.ts

async validate(payload: any) {
  // 🛡️ Map directly to what is signed inside auth.service.ts
  return { 
    id: payload.id,            // Changed from payload.sub to payload.id
    email: payload.email,
    workspaceId: payload.workspaceId, 
    role: payload.role 
  };
}
}