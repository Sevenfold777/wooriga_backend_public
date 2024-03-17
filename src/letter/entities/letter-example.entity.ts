import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';
import { LetterTheme } from './letter-theme.entity';

@Entity()
export class LetterExample extends BaseEntity {
  @Column({ length: 1023 })
  payload: string; // 편지 예문; 1000자 제한

  @ManyToOne(() => LetterTheme, (theme) => theme.examples, {
    onDelete: 'CASCADE',
  })
  theme: LetterTheme;
}
