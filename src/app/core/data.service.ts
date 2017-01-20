import * as _ from 'lodash'
import * as moment from 'moment'
import * as io from 'socket.io-client'
import { Injectable } from '@angular/core'
import { ConfigService } from './config.service'
import { Response, Http } from '@angular/http'
import { Observable } from 'rxjs'

@Injectable()
export class DataService {

  private http: Http
  private configService: ConfigService
  private source: DataSource
  private mockTime: number

  public constructor(http: Http, configService: ConfigService) {
    this.http = http
    this.configService = configService
  }

  public subscribe(fn, type): void {
    switch (this.source) {
      case DataSource.MOCK:
        this.mockData(fn, type)
        break
      case DataSource.SOCKET:
        this.socketData(fn, type)
        break
      default:
        throw new Error('A data source must be selected before any subscription')
    }
  }

  public setSource(source: DataSource): void {
    this.source = source
  }

  public getInitialCount(type: string, unsample: boolean = true): Observable<any> {
    const offset = moment().utcOffset()
    const samplingRatio: number = <number> this.configService.get('data.samplingRatio')
    const url: string = <string> this.configService.get('initialCount.url')
    return this.http
      .get(`${url}?offset=${offset}`)
      .map((res: Response) => {
        const body = res.json()
        const count = _.get(body, type, 0)
        return (unsample === true) ? this.unsample(count, samplingRatio) : count
      })
  }

  private unsample(num: number, ratio: number): number {
    let res: number = (num * 100 / ratio)
    if (num) {
      res += _.random(0, ratio) - ratio / 2
    }
    return Math.round(res)
  }

  private mockData(fn, type) {
    this.mockTime = Date.now()
    setInterval(this.refreshMock.bind(this), this.configService.get('mock.interval'), fn)
    this.refreshMock(fn, type)
  }

  private refreshMock(fn, type) {
    const locations = []
    for (let i = 0; i < this.configService.get('mock.volume'); i++) {
      locations.push({
        type: type,
        time: this.mockTime,
        latitude: _.random(-90, 90, true),
        longitude: _.random(-180, 180, true)
      })
      this.mockTime = this.mockTime + 10
    }
    fn(locations)
  }

  private socketData(fn, type) {
    const socket = io(this.configService.get('socket.server'))
    const filter = <string> this.configService.get('socket.filter')
    socket.on(this.configService.get('socket.type'), (msg) => {
      const locations = _.filter(msg, { [filter]: type })
      fn(this.formatLocations(locations))
    })
  }

  private formatLocations(newLocations: Array<any>, unsample: boolean = true) {
    for (let newLocation of newLocations) {
      newLocation.time = parseInt(newLocation.time, 10)
      newLocation.longitude = parseFloat(newLocation.longitude)
      newLocation.latitude = parseFloat(newLocation.latitude)
    }

    if (unsample === true) {
      const filter = <string> this.configService.get('socket.filter')
      const locationsByType = _.groupBy(newLocations, filter)
      const samplingRatio: number = <number> this.configService.get('data.samplingRatio')

      _.forEach(locationsByType, (pieceOfLocations) => {
        const currentLength: number = pieceOfLocations.length
        const expectedLength: number = this.unsample(pieceOfLocations.length, samplingRatio)
        _(currentLength)
          .range(expectedLength)
          .forEach(() => {
            const element = _.get(pieceOfLocations, _.random(0, currentLength - 1))
            newLocations.push(element)
          })
      })

      newLocations = _.sortBy(newLocations, 'time')
    }

    return newLocations
  }
}

export enum DataSource {
  MOCK,
  SOCKET
}
