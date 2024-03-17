import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FamilyPediaService } from './family-pedia.service';
import { CreateFamilyPediaInput } from './dtos/create-family-pedia.dto';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { CreateRowInput } from './dtos/create-row.dto';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { FamilyPediaRow } from './entities/family-pedia-row.entity';
import { EditRowInput } from './dtos/edit-row.dto';
import { FamilyPedia } from './entities/family-pedia.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { EditPediaPhotoOutput } from './dtos/edit-family-pedia.dto';

@Controller('familyPedia')
export class FamilyPediaController {
  constructor(private readonly familyPediaService: FamilyPediaService) {}

  @Post()
  createFamilyPedia(
    @Body() createFamilyPediaInput: CreateFamilyPediaInput,
  ): Promise<BaseOutput> {
    return this.familyPediaService.createFamilyPedia(createFamilyPediaInput);
  }

  // @Patch(':id')
  @Post(':id/profilePhoto')
  @UseInterceptors(FilesInterceptor('files'))
  editProfilePhoto(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<EditPediaPhotoOutput> {
    return this.familyPediaService.editProfilePhoto(user, id, files);
  }

  @Post(':id')
  createFamilyPediaRows(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() rows: CreateRowInput[],
  ): Promise<BaseOutput> {
    return this.familyPediaService.createFamilyPediaRows(user, id, rows);
  }

  @Patch(':id/rows')
  editFamilyPediaRows(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() rows: EditRowInput[],
  ): Promise<BaseOutput> {
    return this.familyPediaService.editFamilyPediaRows(user, id, rows);
  }

  @Delete(':id/rows')
  deleteFamilyPediaRows(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() rows: { id: number }[],
  ): Promise<BaseOutput> {
    return this.familyPediaService.deleteFamilyPediaRows(user, id, rows);
  }

  @Get()
  findAll(@AuthUser() user: UserId): Promise<FamilyPedia[]> {
    return this.familyPediaService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<FamilyPedia> {
    // @@@@@@@@@@@@@@@@@@ AuthUser 체크
    return this.familyPediaService.findOne(id);
  }

  // @Post(':id/rows')
  // createRow(
  //   @AuthUser() user: UserId,
  //   @Param('id') id: number,
  //   @Body() createRowInput: CreateRowInput,
  // ): Promise<BaseOutput> {
  //   return this.familyPediaService.createRow(user, id, createRowInput);
  // }

  @Delete('rows/:rowId')
  deleteRow(
    @AuthUser() user: UserId,
    @Param('rowId') rowId: number,
  ): Promise<BaseOutput> {
    return this.familyPediaService.deleteRow(rowId, user);
  }

  @Patch('rows/:rowId')
  editRow(
    @AuthUser() user: UserId,
    @Param('rowId') rowId: number,
    @Body() editRowInput: EditRowInput,
  ): Promise<BaseOutput> {
    return this.familyPediaService.editRow(rowId, user, editRowInput);
  }

  @Get(':id/rows')
  findAllRows(@Param('id') id: number): Promise<FamilyPediaRow[]> {
    // @@@@@@@@@@@@@@@@@@ AuthUser 체크
    return this.familyPediaService.findAllRows(id);
  }
}
