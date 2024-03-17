import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { BalanceGame } from './balance-game.entity';

@Entity()
export class BalanceChoice extends BaseEntity {
  @Column()
  payload: string;

  @ManyToOne(() => BalanceGame, (game) => game.choices, { onDelete: 'CASCADE' })
  balanceGame: BalanceGame;

  @ManyToOne(() => User, (user) => user.balanceChoices, {
    onDelete: 'CASCADE',
  })
  user: User;
}
