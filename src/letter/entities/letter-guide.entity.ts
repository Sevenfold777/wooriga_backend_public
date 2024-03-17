import { BaseEntity } from 'src/common/entities/base.entity';
import { DailyEmotions } from 'src/emotions/entities/emotion.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class LetterGuide extends BaseEntity {
  @Column()
  title: string;

  @Column({ length: 1023 })
  payload: string;

  @Column()
  emotion: DailyEmotions;

  @Column({ default: false })
  isPinned: boolean;
}
