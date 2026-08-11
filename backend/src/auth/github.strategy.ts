import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'PENDING_CREDENTIALS',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'PENDING_CREDENTIALS',
      callbackURL: 'http://localhost:5000/auth/github/callback',
      scope: ['user:email'], // Request email access specifically
      
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { username, emails, photos, displayName } = profile;

    const email = emails && emails.length > 0 ? emails[0].value : `${username}@github.placeholder.com`;
    const fullName = displayName || username;
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const userPayload = {
      email,
      firstName,
      lastName,
      picture: photos && photos.length > 0 ? photos[0].value : '',
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