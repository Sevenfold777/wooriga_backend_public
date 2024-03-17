import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { LetterTheme } from './letter-theme.entity';

@Entity()
export class LetterHashtag {
  @PrimaryColumn()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => LetterTheme, (theme) => theme.hashtags)
  themes: LetterTheme[];
}
