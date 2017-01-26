import { Component, AfterViewInit } from '@angular/core'
import * as moment from 'moment'
import * as _ from 'lodash'
import { DataService } from '../core/data.service'
import { ViewChild } from '@angular/core/src/metadata/di'
import { ViewportService } from '../core/viewport.service'
import { ConfigService } from '../core/config.service'
import { ICartesianCoordinates, LocationService, ILocation } from '../core/location.service'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {

  @ViewChild('background') public background
  @ViewChild('animated') public animated
  @ViewChild('canvasShadow') public canvasShadow
  @ViewChild('canvasBubble') public canvasBubble
  public isLoaderDisplayed: boolean = true
  public canvasLayers: Array<number>
  public globalCounter: number = 0
  public time: string

  private viewportService: ViewportService
  private dataService: DataService
  private configService: ConfigService
  private locationService: LocationService

  private locations: Array<ILocation>
  private staticCanvas: Array<IStaticCanvas>
  private delay: number

  public constructor(viewportService: ViewportService, dataService: DataService, configService: ConfigService, locationService: LocationService) {
    this.viewportService = viewportService
    this.dataService = dataService
    this.configService = configService
    this.locationService = locationService

    this.locations = []
    this.staticCanvas = []
    this.canvasLayers = _.range(0, Math.round(60 / this.configService.get('point.persistence')))

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
          canvas.bubbleCanvas.width = width
          canvas.shadowCanvas.width = width
        }
        this.animated.nativeElement.width = width
      })

    this.viewportService.getHeight()
      .subscribe((height) => {
        for (const canvas of this.staticCanvas) {
          canvas.bubbleCanvas.height = height
          canvas.shadowCanvas.height = height
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
        const opacityStep: number = 1 / (this.staticCanvas.length - 1)
        for (let j = 0; j < this.staticCanvas.length; ++j) {
          this.staticCanvas[(j + 1) % this.staticCanvas.length].bubbleCanvas.style.opacity = String(opacityStep * ((j - canvasIndex + this.staticCanvas.length) % this.staticCanvas.length))
          this.staticCanvas[(j + 1) % this.staticCanvas.length].shadowCanvas.style.opacity = String(opacityStep * ((j - canvasIndex + this.staticCanvas.length) % this.staticCanvas.length))
        }

        const previousCanvasIndex = (canvasIndex + 1) % this.staticCanvas.length
        this.staticCanvas[previousCanvasIndex].bubbleContext.clearRect(0, 0, this.staticCanvas[previousCanvasIndex].bubbleCanvas.width, this.staticCanvas[previousCanvasIndex].bubbleCanvas.height)
        this.staticCanvas[previousCanvasIndex].shadowContext.clearRect(0, 0, this.staticCanvas[previousCanvasIndex].shadowCanvas.width, this.staticCanvas[previousCanvasIndex].shadowCanvas.height)

        this.addStaticPoint(canvasIndex, current.latitude, current.longitude)
        this.addAnimatedPoint(current.latitude, current.longitude)
      }
    }

    requestAnimationFrame(this.refresh.bind(this))
  }

  private dispatchStaticCanvases(): void {
    const shadowCanvases: Array<HTMLCanvasElement> = this.canvasShadow.nativeElement.querySelectorAll('canvas')
    for (let index: number = 0; index < shadowCanvases.length; ++index) {
      const shadowCanvas: HTMLCanvasElement = shadowCanvases[index]
      shadowCanvas.height = this.viewportService.getHeight().getValue()
      shadowCanvas.width = this.viewportService.getWidth().getValue()
      this.staticCanvas[index] = this.staticCanvas[index] || {}
      this.staticCanvas[index].shadowCanvas = shadowCanvas
      this.staticCanvas[index].shadowContext = shadowCanvas.getContext('2d')
    }

    const bubbleCanvases: Array<HTMLCanvasElement> = this.canvasBubble.nativeElement.querySelectorAll('canvas')
    for (let index: number = 0; index < bubbleCanvases.length; ++index) {
      const bubbleCanvas: HTMLCanvasElement = bubbleCanvases[index]
      bubbleCanvas.height = this.viewportService.getHeight().getValue()
      bubbleCanvas.width = this.viewportService.getWidth().getValue()
      this.staticCanvas[index] = this.staticCanvas[index] || {}
      this.staticCanvas[index].bubbleCanvas = bubbleCanvas
      this.staticCanvas[index].bubbleContext = bubbleCanvas.getContext('2d')
    }
  }

  private addStaticPoint(index: number, lat: number, lng: number): void {
    const strokeColor: string = this.configService.get('point.stroke')
    const fillColor: string = this.configService.get('point.fill')
    const strokeWidth: number = this.configService.get('point.width')

    const coordinates: ICartesianCoordinates = this.locationService.getTranslate(lat, lng)
    const staticContextBubble: CanvasRenderingContext2D = this.staticCanvas[index].bubbleContext
    staticContextBubble.beginPath()
    staticContextBubble.fillStyle = fillColor
    staticContextBubble.arc(coordinates.x, coordinates.y, strokeWidth, 0, 2 * Math.PI, false)
    staticContextBubble.fill()

    const staticContextShadow: CanvasRenderingContext2D = this.staticCanvas[index].shadowContext
    staticContextShadow.beginPath()
    staticContextShadow.fillStyle = strokeColor
    staticContextShadow.arc(coordinates.x, coordinates.y, strokeWidth * 2, 0, 2 * Math.PI, false)
    staticContextShadow.lineWidth = strokeWidth
    staticContextShadow.strokeStyle = strokeColor
    staticContextShadow.fill()
    staticContextShadow.stroke()
  }

  private addAnimatedPoint(lat: number, lng: number): void {
    const strokeWidth: number = this.configService.get('cursor.width')
    const strokeColor: string = this.configService.get('cursor.stroke')
    const coordinates: ICartesianCoordinates = this.locationService.getTranslate(lat, lng)
    const animatedCanvasBubble: HTMLCanvasElement = <HTMLCanvasElement> this.animated.nativeElement
    const animatedContextBubble: CanvasRenderingContext2D = animatedCanvasBubble.getContext('2d')
    animatedContextBubble.clearRect(0, 0, animatedCanvasBubble.width, animatedCanvasBubble.height)
    animatedContextBubble.beginPath()
    animatedContextBubble.strokeStyle = strokeColor
    animatedContextBubble.lineWidth = strokeWidth
    animatedContextBubble.moveTo(0, coordinates.y)
    animatedContextBubble.lineTo(animatedCanvasBubble.width, coordinates.y)
    animatedContextBubble.moveTo(coordinates.x, 0)
    animatedContextBubble.lineTo(coordinates.x, animatedCanvasBubble.height)
    animatedContextBubble.stroke()
    animatedContextBubble.beginPath()
    animatedContextBubble.lineWidth = .3
    animatedContextBubble.rect(coordinates.x - 5, coordinates.y - 5, 10, 10)
    animatedContextBubble.stroke()
  }

  private hideLoader(): void {
    if (this.isLoaderDisplayed) {
      this.calculateSize()
      this.isLoaderDisplayed = false
    }
  }
}

interface IStaticCanvas {
  bubbleCanvas?: HTMLCanvasElement
  shadowCanvas?: HTMLCanvasElement
  bubbleContext?: CanvasRenderingContext2D
  shadowContext?: CanvasRenderingContext2D
}
