import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private blacklistService: TokenBlacklistService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET as string,
            passReqToCallback: true,
        });
    }

    async validate(req: any, payload: { email: string, sub: string, exp: number }) {
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (token && this.blacklistService.isBlacklisted(token)) {
            throw new UnauthorizedException('Token has been revoked or login first');
        }
        return { email: payload.email, sub: payload.sub, exp: payload.exp };
    }
}
