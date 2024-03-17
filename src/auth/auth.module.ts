import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard, PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Admin } from 'src/admin/entities/admin.entity';

/**
 * Auth Module은 App Module에 import 되어 있지 않지만 딱히 의미 없음
 * User / Family Module의 하위 모듈로 기능 (추후 변경 필요할 수도)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Admin]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // Jwt auth-guard를 전역에서 사용
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
