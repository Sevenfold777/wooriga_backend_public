import { IsNotEmpty } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;
  // updatedAt 필요없어서 baseEntity extend 안함

  @Column()
  @IsNotEmpty()
  title: string;

  @Column()
  @IsNotEmpty()
  body: string;

  @Column({ nullable: true })
  screen?: string;

  @Column({ nullable: true })
  param?: string;

  @ManyToOne(() => User, {
    createForeignKeyConstraints: false,
  })
  receiver: User;

  @ManyToOne(() => User, {
    createForeignKeyConstraints: false,
  })
  sender: User;
}

/** 알림은 30일간 보존 (mysql에 직접 쿼리 보내야)
 * create event notification_clear
 * on schedule every 1 day
 * -- starts '2023-01-24 00:00:00'
 * on completion preserve
 * comment '알림 삭제'
 * do
 * 	delete from notification
 *     where datediff(now(), createdAt) > 29;
 */
