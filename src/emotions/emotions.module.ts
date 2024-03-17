import { Module } from '@nestjs/common';
import { EmotionsService } from './emotions.service';
import { EmotionsController } from './emotions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyEmotion } from './entities/emotion.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyEmotion, User]), NotificationModule],
  providers: [EmotionsService],
  controllers: [EmotionsController],
})
export class EmotionsModule {}
