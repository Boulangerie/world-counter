import { Injectable } from '@angular/core'
import * as _ from 'lodash'

@Injectable()
export class ConfigService {

  private config: any = {
    point: {
      persistence: 10,
      width: 0.05,
      stroke: 'rgba(41, 235, 253, 0.2)',
      fill: 'white',
      cursor: 'white'
    },
    background: {
      path: '/assets/backgrounds/',
      file: 'background-0.jpg'
    },
    sun: {
      display: true,
      refreshInterval: 30000
    },
    data: {
      samplingRatio: 10
    },
    initialCount: {
      url: '/count/daily'
    },
    socket: {
      server: '',
      type: 'hits',
      filter: 'event',
      label: 'video completes'
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
