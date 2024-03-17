import { Comment } from 'src/common/entities/comment.entity';
import { Entity, ManyToOne, OneToMany } from 'typeorm';
import { BalanceGame } from './balance-game.entity';

@Entity()
export class BalanceGameComment extends Comment {
  @ManyToOne(() => BalanceGame, (balanceGame) => balanceGame.comments, {
    onDelete: 'CASCADE',
  })
  balanceGame: BalanceGame;
}
