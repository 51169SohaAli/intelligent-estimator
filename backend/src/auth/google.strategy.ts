import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'PENDING_CREDENTIALS',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PENDING_CREDENTIALS',
      callbackURL: 'http://localhost:5000/auth/google/callback',
      scope: ['email', 'profile'],
      customHeaders: { "prompt": "select_account" }
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    
    const userPayload = {
      email: emails[0].value,
      firstName: name.givenName || '',
      lastName: name.familyName || '',
      picture: photos && photos[0]?.value ? photos[0].value : '',
      accessToken,
    };

    try {
      // 🚀 CALL THE DATABASE VALIDATOR NOW:
      const user = await this.authService.validateOAuthUser(userPayload);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}