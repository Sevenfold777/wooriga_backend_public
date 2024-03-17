import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { BalanceChoice } from './balance-choice.entity';
import { BalanceGameComment } from './balance-game-comment.entity';
import { BalanceGameFamilyComment } from './balance-game-family-comment.entity';

@Entity()
export class BalanceGame extends BaseEntity {
  @Column()
  question: string;

  @Column()
  choiceA: string;

  @Column()
  choiceB: string;

  @OneToMany(() => BalanceChoice, (choice) => choice.balanceGame)
  choices: BalanceChoice[];

  @OneToMany(() => BalanceGameComment, (comment) => comment.balanceGame)
  comments: BalanceGameComment[];

  @OneToMany(() => BalanceGameFamilyComment, (comment) => comment.balanceGame)
  familyComments: BalanceGameFamilyComment[];

  @Column({ default: '늘 함께하고 싶은' })
  commentDecorator: string;
}
