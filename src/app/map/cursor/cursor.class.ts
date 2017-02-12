import * as _ from 'lodash'
import { ICartesianCoordinates } from '../../core/location.service'

export abstract class Cursor {

  protected config: any

  public constructor(config: any) {
    this.config = config
  }

  public abstract animate(canvas: HTMLCanvasElement, coordinates: ICartesianCoordinates): void

  protected toOpacity(color: string, opacity: number): string {
    const rgb = /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(,\s*\d{1,3})?\)$/i.exec(color)
    if (rgb) {
      return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${opacity})`
    } else {
      const hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)
      if (hex) {
        return `rgba(${_.parseInt(hex[1], 16)}, ${_.parseInt(hex[2], 16)}, ${_.parseInt(hex[3], 16)}, ${opacity})`
      } else {
        return color
      }
    }
  }
}
