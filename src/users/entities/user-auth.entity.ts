import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserAuth extends BaseEntity {
  @OneToOne(() => User, (user) => user.userAuth, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  refreshToken: string;

  @Column({ nullable: true })
  providerId?: string;
}
