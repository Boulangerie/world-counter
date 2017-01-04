import { Injectable } from '@angular/core'
import * as _ from 'lodash'

@Injectable()
export class ConfigService {

  private config: any = {
    fps: 20,
    point: {
      persistence: 10,
      width: 0.2,
      stroke: 'lightcyan',
      fill: '#1fc5cf'
    },
    background: {
      path: '/assets/backgrounds/',
      file: 'background-0.jpg'
    },
    sun: {
      display: true,
      refreshInterval: 30
    },
    mock: {
      interval: 30000,
      volume: 5000
    }
  }

  public get(path: string, defaultValue?: any) {
    return _.get(this.config, path, defaultValue)
  }
}
