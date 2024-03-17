import { Comment } from 'src/common/entities/comment.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BalanceGame } from './balance-game.entity';

@Entity()
export class BalanceGameFamilyComment extends Comment {
  @Column()
  familyId: number;

  @ManyToOne(() => BalanceGame, (balanceGame) => balanceGame.familyComments, {
    onDelete: 'CASCADE',
  })
  balanceGame: BalanceGame;
}
