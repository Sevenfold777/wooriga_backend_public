import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

export enum DailyEmotions {
  HAPPY = 'happy',
  PASSION = 'passion',
  COMFORT = 'comfort',
  TIRED = 'tired',
  SAD = 'sad',
  SHARP = 'sharp',
}

@Entity()
export class DailyEmotion extends BaseEntity {
  @Column()
  type: DailyEmotions;

  @Column()
  date: Date;

  @ManyToOne(() => User, (user) => user.dailyEmotions, { onDelete: 'CASCADE' })
  user: User;
}
