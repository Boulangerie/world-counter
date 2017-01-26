import { Injectable } from '@angular/core'
import { ViewportService } from './viewport.service'

@Injectable()
export class LocationService {

  private viewportService: ViewportService

  public constructor(viewportService: ViewportService) {
    this.viewportService = viewportService
  }

  public getTranslate(lat: number, lng: number): ICartesianCoordinates {
    let x: number = (lng + 180) * (this.viewportService.getWidth().getValue() / 360)
    let y: number = (lat - 90) / -180 * this.viewportService.getHeight().getValue()
    return {
      x: x,
      y: y
    }
  }
}

export interface ILocation {
  time: number
  latitude: number
  longitude: number
}

export interface ICartesianCoordinates {
  x: number
  y: number
}
