import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Family } from './entities/familiy.entity';
import { AuthModule } from 'src/auth/auth.module';
import { MessageFamily } from 'src/messages/entities/message-family.entity';
import { Photo } from 'src/photos/entities/photo.entity';
import { UserAuth } from 'src/users/entities/user-auth.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserAuth, Family, MessageFamily, Photo]),
    AuthModule,
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule {}
