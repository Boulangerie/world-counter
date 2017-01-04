import { Injectable } from '@angular/core'
import * as _ from 'lodash'
import { ConfigService } from './config.service'

@Injectable()
export class DataService {

  private configService: ConfigService
  private source: DataSource
  private mockTime: number

  public constructor(configService: ConfigService) {
    this.configService = configService
  }

  public subscribe(fn): void {
    switch (this.source) {
      case DataSource.MOCK:
        this.mockData(fn)
        break
      case DataSource.SOCKET:
        this.socketData(fn)
        break
      default:
        throw new Error('A data source must be selected before any subscription')
    }
  }

  public setSource(source: DataSource): void {
    this.source = source
  }

  private mockData(fn) {
    this.mockTime = Date.now()
    setInterval(this.refreshMock.bind(this), this.configService.get('mock.interval'), fn)
    this.refreshMock(fn)
  }

  private refreshMock(fn) {
    const locations = []
    for (let i = 0; i < this.configService.get('mock.volume'); i++) {
      locations.push({
        time: this.mockTime,
        latitude: _.random(-90, 90, true),
        longitude: _.random(-180, 180, true)
      })
      this.mockTime = this.mockTime + 10
    }
    fn(locations)
  }

  private socketData(fn) {
    const socket = io('http://' + window.location.hostname + ':3000')
    socket.on('inworld-message', (msg) => {
      fn(this.formatLocations(msg.data))
    })
  }

  private formatLocations(newLocations) {
    for (let newLocation of newLocations) {
      newLocation.time = parseFloat(newLocation.time)
      newLocation.longitude = parseFloat(newLocation.longitude)
      newLocation.latitude = parseFloat(newLocation.latitude)
    }
    return newLocations
  }
}

export enum DataSource {
  MOCK,
  SOCKET
}
