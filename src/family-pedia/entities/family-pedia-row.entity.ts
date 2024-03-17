import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { FamilyPedia } from './family-pedia.entity';

@Entity()
export class FamilyPediaRow extends BaseEntity {
  @ManyToOne(() => FamilyPedia, (familyPedia) => familyPedia.rows, {
    onDelete: 'CASCADE',
  })
  familyPedia: FamilyPedia;

  @Column()
  tag: string;

  @Column()
  payload: string;

  // 마지막 수정자 기록 - Relation으로 하면 cascade해야하므로 단순 col
  @Column()
  lastEditor: number;
}
