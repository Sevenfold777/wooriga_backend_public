import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Generated } from 'typeorm';

@Entity()
export class Board extends BaseEntity {
  @Column()
  title: string;

  // 최초 생성 시 null 가능
  @Column({ nullable: true })
  url?: string;

  // admin 설정 통하여 Public shown
  @Column({ default: false })
  isShown: boolean;

  @Column()
  order: number;
}
