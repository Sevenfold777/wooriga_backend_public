import { Module } from '@nestjs/common';
import { LetterService } from './letter.service';
import { LetterController } from './letter.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Letter } from './entities/letter.entity';
import { LetterTheme } from './entities/letter-theme.entity';
import { LetterKeep } from './entities/letter-keep.entity';
import { LetterHashtag } from './entities/letter-hashtag.entity';
import { LetterExample } from './entities/letter-example.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { User } from 'src/users/entities/user.entity';
import { LetterGuide } from './entities/letter-guide.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Letter,
      LetterTheme,
      LetterKeep,
      LetterHashtag,
      LetterExample,
      User,
      LetterGuide,
    ]),
    NotificationModule,
  ],
  controllers: [LetterController],
  providers: [LetterService],
})
export class LetterModule {}
