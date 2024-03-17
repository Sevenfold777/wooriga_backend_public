import { Module } from '@nestjs/common';
import { BalanceGameService } from './balance-game.service';
import { BalanceGameController } from './balance-game.controller';
import { BalanceGame } from './entities/balance-game.entity';
import { BalanceChoice } from './entities/balance-choice.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceGameComment } from './entities/balance-game-comment.entity';
import { BalanceGameFamilyComment } from './entities/balance-game-family-comment.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BalanceGame,
      BalanceChoice,
      BalanceGameComment,
      BalanceGameFamilyComment,
      User,
    ]),
    NotificationModule,
  ],
  controllers: [BalanceGameController],
  providers: [BalanceGameService],
})
export class BalanceGameModule {}
