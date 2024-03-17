import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { BoardsService } from './boards.service';
import { CreateBoardInput } from './dtos/create-board.dto';
import { EditBoardInput } from './dtos/update-board.dto';
import { Board } from './entities/board.entity';

@Public()
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  /** createBoard */
  @Post()
  createBoard(@Body() createBoardInput: CreateBoardInput): Promise<BaseOutput> {
    return this.boardsService.createBoard(createBoardInput);
  }

  /** deleteBoard */
  @Delete(':id')
  deleteBoard(@Param('id') id: number): Promise<BaseOutput> {
    return this.boardsService.deleteBoard(id);
  }

  /** updateBoard */
  @Patch(':id')
  editBoard(
    @Param('id') id: number,
    @Body() editBoardInput: EditBoardInput,
  ): Promise<BaseOutput> {
    return this.boardsService.editBoard(id, editBoardInput);
  }

  /** findVisibleBoards */
  @Get('visible')
  findVisibleBoards(): Promise<Board[]> {
    return this.boardsService.findVisibleBoards();
  }

  /** findAllBoards */
  @Get()
  findAllBoards(): Promise<Board[]> {
    return this.boardsService.findAllBoards();
  }

  /** findBoard */
  @Get(':id')
  findBoard(@Param('id') id: number): Promise<Board> {
    return this.boardsService.findBoard(id);
  }
}
