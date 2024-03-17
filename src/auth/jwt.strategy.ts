import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Admin } from 'src/admin/entities/admin.entity';
import { Status } from 'src/common/entities/comment.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY,
      ignoreExpiration: false,
      passReqToCallback: true, // validate에 req 넘기기 위하여
    });
  }

  /////// !!! 여기를 바꿔야 fast, stateless jwt
  // async validate({ userId, familyId }: { userId: number; familyId: number }) {
  //   const user = { userId, familyId };
  //   return user;
  // }

  async validate(
    req,
    { userId, familyId }: { userId: number; familyId: number },
  ) {
    // family 정보도 req header에 포함
    // const user = await this.userRepository.findOne({
    //   where: { id, status: Status.ACTIVE },
    //   relations: { family: true },
    // });

    // if (!user) {
    //   throw new UnauthorizedException();
    // }

    const user = { userId, familyId };
    console.log(user);

    // admin api일 경우 DB 체크
    if (req.isAdmin) {
      const admin = await this.adminRepository.findOne({
        where: { userId },
      });

      if (!admin) {
        throw new UnauthorizedException();
      }
    }

    return user; // payload의 모든 protperty를 포함하는 객체를 리턴하면 됨
  }
}
