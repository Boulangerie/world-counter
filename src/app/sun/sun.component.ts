import { Component } from '@angular/core';
import { ViewportService } from '../core/viewport.service'
import { ConfigService } from '../core/config.service'

@Component({
  selector: 'app-sun',
  templateUrl: './sun.component.html',
  styleUrls: ['./sun.component.scss']
})
export class SunComponent {

  public coordinates: { x: number, y: number } = { x: 0, y: 0 }
  private viewportService: ViewportService
  private configService: ConfigService

  public constructor(viewportService: ViewportService, configService: ConfigService) {
    this.viewportService = viewportService
    this.configService = configService

    setInterval(() => {
      this.refresh()
    }, this.configService.get('sun.refreshInterval') * 1000)

    this.viewportService.getWidth()
      .subscribe(() => {
        this.refresh()
      })

    this.viewportService.getHeight()
      .subscribe(() => {
        this.refresh()
      })

    this.refresh()
  }

  public get height(): number {
    return this.viewportService.getHeight().getValue()
  }

  public get width(): number {
    return this.viewportService.getWidth().getValue()
  }

  private refresh() {
    this.coordinates = this.getSunPosition(Date.now() / 1000)
  }

  private getSunPosition(time: number) {
    let b = (time - 946684800) / 31557600
    let h = b / 100
    let e = 2.236174E-4 + 1.35263017E-7 * h
    let f = Math.PI / 180
    let g = time / 86400 + 2440587.5
    let c = (g - 2451545) / 36525
    let k = 280.46646 + 36000.76983 * c + 3.032E-4 * c * c
    let d = 357.52911 + 35999.05029 * c + 1.537E-4 * c * c

    h = 9.71719333E-5 + 4.14515697E-8 * h
    g = (280.46061837 + 360.98564736629 * (g - 2451545) + 3.87933E-4 * c * c + c * c * c / 3871E4) * f
    d = (1.914602 - .004817 * c - 1.4E-5 * c * c) * Math.sin(d * f) + (.019993 - 1.01E-4 * c) * Math.sin(2 * d * f) + 2.89E-4 * Math.sin(3 * d * f)
    k = k + d
    d = 23 + 26 / 60 + 21.448 / 3600 + 46.815 / 3600 * c
    c = Math.atan2(Math.cos(d * f) * Math.sin(k * f), Math.cos(k * f))
    k = Math.sin(d * f) * Math.sin(k * f)
    c = c + (e + h * Math.sin(c) * Math.tan(k)) * b
    k = k + h * Math.cos(c) * b

    let zen_RA = g / f % 360
    let sun_ra = c / f % 360
    let lat = k / f;

    let lng;
    for (lng = sun_ra - zen_RA; -180 > lng;) {
      lng += 360;
    }
    for (; 180 < lng;) {
      lng -= 360;
    }
    return this.getTranslate(lat, lng)
  }

  private getTranslate(lat, lng) {
    let x = (lng + 180) * (this.viewportService.getWidth().getValue() / 360)
    let y = (lat - 90) / -180 * this.viewportService.getHeight().getValue()
    return { x: x, y: y }
  }
}
