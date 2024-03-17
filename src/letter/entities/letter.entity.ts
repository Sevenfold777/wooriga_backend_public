import { BaseEntity } from 'src/common/entities/base.entity';
import { DailyEmotions } from 'src/emotions/entities/emotion.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { LetterTheme } from './letter-theme.entity';
import { LetterKeep } from './letter-keep.entity';

@Entity()
export class Letter extends BaseEntity {
  @Column()
  title: string;

  @Column({ length: 1023 })
  payload: string; // 1000자 제한

  @Column()
  emotion: DailyEmotions;

  @Column({ default: false })
  isTimeCapsule: boolean;

  @Column({ nullable: true })
  receiveDate: Date; // createdAt과 같으면 지금 전송; 다르면 TimeCapsule

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isTemp: boolean;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  sender: User;

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  receiver: User;

  @ManyToOne(() => LetterTheme, { createForeignKeyConstraints: false })
  theme: LetterTheme;

  @OneToMany(() => LetterKeep, (keep) => keep.letter)
  keeps: LetterKeep[];
}
