import {Injectable} from '@angular/core'
import { ConfigService } from '../../core/config.service'
import { Cursor } from './cursor.class'
import { SquareTargetCursor } from './square-target.cursor'
import { BubbleCursor } from './bubble.cursor'

@Injectable()
export class CursorFactory {

  private configService: ConfigService

  public constructor(configService: ConfigService) {
    this.configService = configService
  }

  public get(cursor: string): Cursor {
    const config: any = this.configService.get('cursor')
    switch (cursor) {
      case 'bubble':
        return new BubbleCursor(config)
      case 'square-target':
      default:
        return new SquareTargetCursor(config)
    }
  }
}
