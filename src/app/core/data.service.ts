import { Injectable } from '@angular/core'
import * as _ from 'lodash'

@Injectable()
export class DataService {

  private static MOCK_INTERVAL: number = 10000
  private static MOCK_VOLUME: number = 100000

  private source: DataSource

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
    setInterval(() => {
      const time = Date.now()
      const locations = []
      for (let i = 0; i < DataService.MOCK_VOLUME; ++i) {
        locations.push({
          time: time + i,
          latitude: _.random(-90, 90, true),
          longitude: _.random(-180, 180, true)
        })
      }
      fn(locations)
    }, DataService.MOCK_INTERVAL)
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
