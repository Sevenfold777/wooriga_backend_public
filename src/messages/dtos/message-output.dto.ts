import { DailyEmotions } from 'src/emotions/entities/emotion.entity';
import { ServiceLinked } from '../entities/message.entity';

export class MessageFamilyOutput {
  id: number;
  payload: string;
  emotion: DailyEmotions;
  receiveDate: Date;
  commentsCount: number;
  metoosCount: number;
  isMetooed: boolean;
  isKept: boolean;
  linkTo?: ServiceLinked;
}

export class MessageOutput {
  id: number;
  payload: string;
  emotion: DailyEmotions;
  uploadAt: Date;
  commentsCount: number;
  metoosCount: number;
  isMetooed: boolean;
  isKept: boolean;
  sharedCount?: number;
  commentDecorator?: string;
}
