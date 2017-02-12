import * as _ from 'lodash'
import { Cursor } from './cursor.class'
import { ICartesianCoordinates } from '../../core/location.service'

export class BubbleCursor extends Cursor {

  private lightColor: string

  public constructor(config: any) {
    super(config)
    this.lightColor = this.toOpacity(this.config.stroke, 0.2)
  }

  public animate(canvas: HTMLCanvasElement, coordinates: ICartesianCoordinates): void {
    const context: CanvasRenderingContext2D = canvas.getContext('2d')
    const width: number = _.random(this.config.width / 10, this.config.width, true)
    context.clearRect(0, 0, canvas.width, canvas.height)

    context.beginPath()
    context.arc(coordinates.x, coordinates.y, width * 112, 0, 2 * Math.PI, false)
    context.fillStyle = this.lightColor
    context.fill()
    context.lineWidth = width
    context.strokeStyle = this.config.stroke
    context.stroke()

    context.beginPath()
    context.arc(coordinates.x, coordinates.y, width * 75, 0, 2 * Math.PI, false)
    context.fillStyle = this.lightColor
    context.fill()
    context.lineWidth = width * 5
    context.strokeStyle = this.config.stroke
    context.stroke()

    context.beginPath()
    context.arc(coordinates.x, coordinates.y, width * 5, 0, 2 * Math.PI, false)
    context.fillStyle = 'rgb(41, 235, 253)'
    context.fill()
  }
}
