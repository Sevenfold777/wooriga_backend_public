import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { FamilyPediaRow } from './family-pedia-row.entity';

@Entity()
export class FamilyPedia extends BaseEntity {
  @Column({
    default:
      'https://wooriga-prod.s3.ap-northeast-2.amazonaws.com/familyPedia/default.jpeg',
  })
  profilePhoto: string;

  @Column({ default: 2000 })
  profileWidth: number;

  @Column({ default: 1500 })
  profileHeight: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  owner: User;

  @OneToMany(() => FamilyPediaRow, (row) => row.familyPedia)
  rows: FamilyPediaRow[];
}
