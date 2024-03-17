import { Module } from '@nestjs/common';
import { FamilyPediaService } from './family-pedia.service';
import { FamilyPediaController } from './family-pedia.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyPedia } from './entities/family-pedia.entity';
import { FamilyPediaRow } from './entities/family-pedia-row.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { User } from 'src/users/entities/user.entity';
import { UploadsModule } from 'src/uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FamilyPedia, FamilyPediaRow, User]),
    NotificationModule,
    UploadsModule,
  ],
  controllers: [FamilyPediaController],
  providers: [FamilyPediaService],
  exports: [FamilyPediaService],
})
export class FamilyPediaModule {}
