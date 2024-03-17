import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LetterExample } from './letter-example.entity';
import { LetterHashtag } from './letter-hashtag.entity';
import { Letter } from './letter.entity';

@Entity()
export class LetterTheme extends BaseEntity {
  @Column()
  title: string;

  @Column()
  payload: string; // webview url?

  @Column()
  payloadWidth: number;

  @Column()
  payloadHeight: number;

  @Column()
  recommendText: string;

  @OneToMany(() => LetterExample, (example) => example.theme)
  examples: LetterExample[];

  @OneToMany(() => Letter, (letter) => letter.theme)
  letters: Letter[];

  @ManyToMany(() => LetterHashtag, (hashtag) => hashtag.themes, {
    cascade: true,
  })
  @JoinTable({ name: 'letter_theme_hashtag' })
  hashtags: LetterHashtag[];
}
