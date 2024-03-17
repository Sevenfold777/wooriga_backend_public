import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Admin extends BaseEntity {
  @Column()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  name: string;

  @PrimaryColumn()
  userId: number;
}
