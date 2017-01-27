import { Injectable } from '@angular/core'
import * as _ from 'lodash'

@Injectable()
export class ConfigService {

  private config: any = {
    point: {
      persistence: 10,
      width: 0.2,
      stroke: 'rgba(41, 235, 253, 0.2)',
      fill: 'white'
    },
    cursor: {
      stroke: 'white',
      width: 0.2
    },
    background: {
      path: 'assets/backgrounds/',
      file: 'background-0.jpg'
    },
    sun: {
      display: true,
      refreshInterval: 30000
    },
    data: {
      minTimeGap: 10000,
      source: 'socket'
    },
    initialCount: {
      url: '/count/daily'
    },
    socket: {
      server: '',
      event: 'hits',
      filter: 'event',
      type: 'videocomplete',
      label: 'video completes'
    },
    mock: {
      interval: 1000,
      volume: 1000,
      gap: 40
    }
  }

  public constructor() {
    let storageConfig = localStorage.getItem('config')
    let queryConfig = this.getQueryParams()
    _.extend(this.config, {}, storageConfig, queryConfig)
  }

  public get(path: string, defaultValue?: any): any {
    return _.get(this.config, path, defaultValue)
  }

  public set(path: string, value: any): void {
    _.set(this.config, path, value)
    localStorage.setItem('config', this.config)
  }

  private getQueryParams(): any {
    return _.chain(window)
      .get<_.LoDashExplicitWrapper<string>>('location.search', '')
      .trimStart('?')
      .split('&')
      .compact()
      .map<any>((param: string): Array<string> => {
        return param.split('=')
      })
      .fromPairs()
      .mapValues((value: string, key: string) => {
        const currentValue = _.get(this.config, key)
        const decodedValue = decodeURIComponent(value)
        if (!_.isUndefined(currentValue)) {
          const currentType = _.upperFirst(typeof currentValue)
          return window[currentType](decodedValue)
        } else {
          return decodedValue
        }
      })
      .value()
  }

}
