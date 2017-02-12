import { Component, AfterViewInit } from '@angular/core'
import * as moment from 'moment'
import * as _ from 'lodash'
import { DataService } from '../core/data.service'
import { ViewChild } from '@angular/core/src/metadata/di'
import { ViewportService } from '../core/viewport.service'
import { ConfigService } from '../core/config.service'
import { ICartesianCoordinates, LocationService, ILocation } from '../core/location.service'
import { Cursor } from './cursor/cursor.class'
import { CursorFactory } from './cursor/cursor.factory'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {

  @ViewChild('background') public background
  @ViewChild('animated') public animated
  @ViewChild('canvasBack') public canvasBack
  @ViewChild('canvasFront') public canvasFront
  public isLoaderDisplayed: boolean = true
  public canvasLayers: Array<number>
  public globalCounter: number = 0
  public time: string

  private viewportService: ViewportService
  private dataService: DataService
  private configService: ConfigService
  private locationService: LocationService
  private cursorFactory: CursorFactory

  private locations: Array<ILocation>
  private staticCanvas: Array<IStaticCanvas>
  private delay: number
  private cursor: Cursor

  public constructor(viewportService: ViewportService, dataService: DataService, configService: ConfigService, locationService: LocationService, cursorFactory: CursorFactory) {
    this.viewportService = viewportService
    this.dataService = dataService
    this.configService = configService
    this.locationService = locationService
    this.cursorFactory = cursorFactory

    this.locations = []
    this.staticCanvas = []
    this.canvasLayers = _.range(0, Math.round(60 / this.configService.get('point.persistence')))

    const cursorType: string = this.configService.get('cursor.type')
    this.cursor = this.cursorFactory.get(cursorType)

    this.dataService
      .getInitialCount()
      .subscribe((count: number) => {
        this.globalCounter = count
      }, () => {
        this.globalCounter = 0
      })

    this.dataService.subscribe((locations) => {
      if (!this.delay && (this.locations.length > 0)) {
        const minTimeGap: number = <number> this.configService.get('data.minTimeGap')
        this.delay = Date.now() - this.locations[0].time + minTimeGap
      }
      for (const location of locations) {
        this.locations.push(location)
      }
    })
  }

  public ngAfterViewInit(): void {
    this.dispatchStaticCanvases()

    this.refresh()
  }

  public get label(): string {
    return this.configService.get('socket.label')
  }

  private calculateSize(): void {
    this.viewportService.getWidth()
      .subscribe((width) => {
        for (const canvas of this.staticCanvas) {
          canvas.frontCanvas.width = width
          canvas.backCanvas.width = width
        }
        this.animated.nativeElement.width = width
      })

    this.viewportService.getHeight()
      .subscribe((height) => {
        for (const canvas of this.staticCanvas) {
          canvas.frontCanvas.height = height
          canvas.backCanvas.height = height
        }
        this.animated.nativeElement.height = height
      })
  }

  private refresh(): void {
    if ((typeof this.globalCounter === 'number') && (this.locations.length > 0) && (Date.now() - this.locations[0].time > this.delay)) {
      this.hideLoader()

      let current: ILocation = this.locations[0]
      let gapTime: number = Date.now() - current.time
      if (gapTime > this.delay) {
        this.locations.shift()
        this.globalCounter++

        this.time = moment(current.time).format('HH:mm:ss')

        const canvasIndex: number = Math.floor(this.staticCanvas.length * (new Date(current.time)).getMinutes() / 60)

        this.updateCanvasesOpacity(canvasIndex)

        this.addStaticPoint(canvasIndex, current.latitude, current.longitude)
        this.addAnimatedPoint(current.latitude, current.longitude)
      }
    }

    requestAnimationFrame(this.refresh.bind(this))
  }

  private updateCanvasesOpacity(canvasIndex: number): void {
    const opacityStep: number = 1 / (this.staticCanvas.length - 1)
    for (let j = 0; j < this.staticCanvas.length; ++j) {
      this.staticCanvas[(j + 1) % this.staticCanvas.length].frontCanvas.style.opacity = String(opacityStep * ((j - canvasIndex + this.staticCanvas.length) % this.staticCanvas.length))
      this.staticCanvas[(j + 1) % this.staticCanvas.length].backCanvas.style.opacity = String(opacityStep * ((j - canvasIndex + this.staticCanvas.length) % this.staticCanvas.length))
    }

    const previousCanvasIndex = (canvasIndex + 1) % this.staticCanvas.length
    this.staticCanvas[previousCanvasIndex].frontContext.clearRect(0, 0, this.staticCanvas[previousCanvasIndex].frontCanvas.width, this.staticCanvas[previousCanvasIndex].frontCanvas.height)
    this.staticCanvas[previousCanvasIndex].backContext.clearRect(0, 0, this.staticCanvas[previousCanvasIndex].backCanvas.width, this.staticCanvas[previousCanvasIndex].backCanvas.height)
  }

  private dispatchStaticCanvases(): void {
    const backCanvases: Array<HTMLCanvasElement> = this.canvasBack.nativeElement.querySelectorAll('canvas')
    for (let index: number = 0; index < backCanvases.length; ++index) {
      const backCanvas: HTMLCanvasElement = backCanvases[index]
      backCanvas.height = this.viewportService.getHeight().getValue()
      backCanvas.width = this.viewportService.getWidth().getValue()
      this.staticCanvas[index] = this.staticCanvas[index] || {}
      this.staticCanvas[index].backCanvas = backCanvas
      this.staticCanvas[index].backContext = backCanvas.getContext('2d')
    }

    const frontCanvases: Array<HTMLCanvasElement> = this.canvasFront.nativeElement.querySelectorAll('canvas')
    for (let index: number = 0; index < frontCanvases.length; ++index) {
      const frontCanvas: HTMLCanvasElement = frontCanvases[index]
      frontCanvas.height = this.viewportService.getHeight().getValue()
      frontCanvas.width = this.viewportService.getWidth().getValue()
      this.staticCanvas[index] = this.staticCanvas[index] || {}
      this.staticCanvas[index].frontCanvas = frontCanvas
      this.staticCanvas[index].frontContext = frontCanvas.getContext('2d')
    }
  }

  private addStaticPoint(index: number, lat: number, lng: number): void {
    const strokeColor: string = this.configService.get('point.stroke')
    const fillColor: string = this.configService.get('point.fill')
    const strokeWidth: number = this.configService.get('point.width')

    const coordinates: ICartesianCoordinates = this.locationService.getTranslate(lat, lng)
    const frontStaticContext: CanvasRenderingContext2D = this.staticCanvas[index].frontContext
    frontStaticContext.beginPath()
    frontStaticContext.fillStyle = fillColor
    frontStaticContext.arc(coordinates.x, coordinates.y, strokeWidth, 0, 2 * Math.PI, false)
    frontStaticContext.fill()

    const backStaticContext: CanvasRenderingContext2D = this.staticCanvas[index].backContext
    backStaticContext.beginPath()
    backStaticContext.fillStyle = strokeColor
    backStaticContext.arc(coordinates.x, coordinates.y, strokeWidth * 2, 0, 2 * Math.PI, false)
    backStaticContext.lineWidth = strokeWidth
    backStaticContext.strokeStyle = strokeColor
    backStaticContext.fill()
    backStaticContext.stroke()
  }

  private addAnimatedPoint(lat: number, lng: number): void {
    const coordinates: ICartesianCoordinates = this.locationService.getTranslate(lat, lng)
    const canvas: HTMLCanvasElement = <HTMLCanvasElement> this.animated.nativeElement
    this.cursor.animate(canvas, coordinates)
  }

  private hideLoader(): void {
    if (this.isLoaderDisplayed) {
      this.calculateSize()
      this.isLoaderDisplayed = false
    }
  }
}

interface IStaticCanvas {
  frontCanvas?: HTMLCanvasElement
  backCanvas?: HTMLCanvasElement
  frontContext?: CanvasRenderingContext2D
  backContext?: CanvasRenderingContext2D
}
