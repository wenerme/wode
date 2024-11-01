import { Injectable } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async signIn(username: string, pass: string) {
    // const user = await this.usersService.findOne(username);
    // if (user?.password !== pass) {
    //   throw new UnauthorizedException();
    // }
    const payload = { username, sub: '1' };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
