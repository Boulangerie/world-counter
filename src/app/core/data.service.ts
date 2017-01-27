import * as _ from 'lodash'
import * as moment from 'moment'
import * as io from 'socket.io-client'
import { Injectable } from '@angular/core'
import { ConfigService } from './config.service'
import { Response, Http } from '@angular/http'
import { Observable } from 'rxjs'
import { ILocation } from './location.service'

@Injectable()
export class DataService {

  private http: Http
  private configService: ConfigService
  private source: DataSource
  private mockTime: number

  public constructor(http: Http, configService: ConfigService) {
    this.http = http
    this.configService = configService
    this.source = configService.get('data.source')
  }

  public subscribe(fn): void {
    switch (this.source) {
      case 'mock':
        this.mockData(fn)
        break
      case 'socket':
        this.socketData(fn)
        break
      default:
        throw new Error('A data source must be selected before any subscription')
    }
  }

  public getInitialCount(): Observable<any> {
    const offset: number = moment().utcOffset()
    const url: string = <string> this.configService.get('initialCount.url')
    const type: string = <string> this.configService.get('socket.type')
    return this.http
      .get(`${url}?offset=${offset}`)
      .map((res: Response) => {
        const body = res.json()
        const count: number = _.get(body, type, 0)
        return count
      })
  }

  private mockData(fn: Function): void {
    this.mockTime = Date.now()
    setInterval(this.refreshMock.bind(this), this.configService.get('mock.interval'), fn)
    this.refreshMock(fn)
  }

  private refreshMock(fn: Function): void {
    const locations: Array<ILocation> = []
    const filter: string = <string> this.configService.get('socket.filter')
    const type: string = <string> this.configService.get('socket.type')
    const coordinates: Array<string> = <Array<string>> this.configService.get('mock.coordinates')
    const gap: number = <number> this.configService.get('mock.gap')
    for (let i: number = 0; i < this.configService.get('mock.volume'); i++) {
      const pieceOfCoordinatesIndex: number = _.random(0, coordinates.length - 1)
      const pieceOfCoordinates = _.chain(coordinates)
        .get<_.LoDashExplicitWrapper<string>>(pieceOfCoordinatesIndex)
        .split(',')
      const latitude: number = pieceOfCoordinates
        .get<_.LoDashExplicitWrapper<string>>(0)
        .thru(parseFloat)
        .value()
      const longitude: number = pieceOfCoordinates
        .get<_.LoDashExplicitWrapper<string>>(1)
        .thru(parseFloat)
        .value()
      let location: ILocation = {
        time: this.mockTime,
        latitude: latitude,
        longitude: longitude
      }
      if (filter) {
        location[filter] = type
      }
      locations.push(location)
      this.mockTime = this.mockTime + gap
    }
    fn(locations)
  }

  private socketData(fn: Function): void {
    const socket: SocketIOClient.Socket = io(this.configService.get('socket.server'))
    const event: string = <string> this.configService.get('socket.event')
    const filter: string = <string> this.configService.get('socket.filter')
    const type: string = <string> this.configService.get('socket.type')
    socket.on(event, (msg) => {
      const locations: Array<ILocation> = filter ? _.filter(msg, { [filter]: type }) : msg
      fn(locations)
    })
  }

}

export type DataSource = 'mock' | 'socket'
