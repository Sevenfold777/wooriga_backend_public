import { BaseEntity } from 'src/common/entities/base.entity';
import { DailyEmotions } from 'src/emotions/entities/emotion.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { Letter } from './letter.entity';

@Entity()
export class LetterKeep extends BaseEntity {
  @ManyToOne(() => User, (user) => user.letterKeeps, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Letter, (letter) => letter.keeps, {
    onDelete: 'CASCADE',
  })
  letter: Letter;
}
