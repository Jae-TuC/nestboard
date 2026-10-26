import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
    private blacklist = new Map<string, number>();

    add(token: string, exp: number) {
        this.blacklist.set(token, exp * 1000);
    }

    isBlacklisted(token: string): boolean {
        const exp = this.blacklist.get(token);
        if (!exp) return false;

        if (Date.now() > exp) {
            this.blacklist.delete(token); // Clean up expired token
            return false;
        }

        return true;
    }
}
