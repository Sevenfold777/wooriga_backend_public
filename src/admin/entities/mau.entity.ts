import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class MAU {
  @PrimaryColumn()
  date: Date;

  @Column()
  count: number;
}
