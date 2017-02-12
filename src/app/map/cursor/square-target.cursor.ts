import { Cursor } from './cursor.class'
import { ICartesianCoordinates } from '../../core/location.service'

export class SquareTargetCursor extends Cursor {
  public animate(canvas: HTMLCanvasElement, coordinates: ICartesianCoordinates): void {
    const context: CanvasRenderingContext2D = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.beginPath()
    context.strokeStyle = this.config.stroke
    context.lineWidth = this.config.width
    context.moveTo(0, coordinates.y)
    context.lineTo(canvas.width, coordinates.y)
    context.moveTo(coordinates.x, 0)
    context.lineTo(coordinates.x, canvas.height)
    context.stroke()
    context.beginPath()
    context.lineWidth = .3
    context.rect(coordinates.x - 5, coordinates.y - 5, 10, 10)
    context.stroke()
  }
}
