import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { Repository } from 'typeorm';
import { CreateBoardInput } from './dtos/create-board.dto';
import { EditBoardInput } from './dtos/update-board.dto';
import { Board } from './entities/board.entity';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board) private boardRepository: Repository<Board>,
  ) {}

  /** createBoard */
  async createBoard({ title, url }: CreateBoardInput): Promise<BaseOutput> {
    const board = this.boardRepository.create({ title, url });

    try {
      await this.boardRepository.save(board);
    } catch (e) {
      return { ok: false, error: e.code };
    }

    return { ok: true };
  }

  /** deleteBoard */
  async deleteBoard(id: number): Promise<BaseOutput> {
    const result = await this.boardRepository.delete({ id });

    if (result.affected === 0) {
      return { ok: false, error: 'Board Not found.' };
    }

    return { ok: true };
  }

  /** updateBoard */
  async editBoard(
    id: number,
    editBoardInput: EditBoardInput,
  ): Promise<BaseOutput> {
    const result = await this.boardRepository.update({ id }, editBoardInput);

    if (result.affected === 0) {
      return { ok: false, error: 'Board Not found.' };
    }

    return { ok: true };
  }

  /** findVisibleBoards */
  findVisibleBoards(): Promise<Board[]> {
    return this.boardRepository.find({
      where: { isShown: true },
      order: { order: 'asc' },
    });
  }

  /** findAllBoards */
  findAllBoards(): Promise<Board[]> {
    return this.boardRepository.find();
  }
  /** findBoard */
  findBoard(id: number): Promise<Board> {
    return this.boardRepository.findOne({ where: { id, isShown: true } });
  }
}
