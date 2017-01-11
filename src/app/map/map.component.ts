import { Component } from '@angular/core'
import * as moment from 'moment'
import * as _ from 'lodash'
import { DataSource, DataService } from '../core/data.service'
import { ViewChild } from '@angular/core/src/metadata/di'
import { ViewportService } from '../core/viewport.service'
import { ConfigService } from '../core/config.service'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent {

  @ViewChild('background') public background
  @ViewChild('animated') public animated
  @ViewChild('canvasShadow') public canvasShadow
  @ViewChild('canvasBubble') public canvasBubble
  public isLoaderDisplayed: boolean = true
  public canvasLayers: Array<number>
  public globalCounter: number
  public time: string

  private viewportService: ViewportService
  private dataService: DataService
  private configService: ConfigService

  private locations: Array<any>
  private startTimestamp: number
  private startTime: number
  private staticCanvas: Array<any>
  private static TYPE: string = 'videocomplete'

  public constructor(viewportService: ViewportService, dataService: DataService, configService: ConfigService) {
    this.viewportService = viewportService
    this.dataService = dataService
    this.configService = configService

    this.locations = []
    this.staticCanvas = []
    this.canvasLayers = _.range(0, Math.round(60 / this.configService.get('point.persistence')))

    this.dataService
      .getDailyCount(MapComponent.TYPE)
      .subscribe((count: number) => {
        console.log(`Daily count ${count}`)
        this.globalCounter = count
      })

    this.dataService.setSource(DataSource.SOCKET)
    this.dataService.subscribe((locations) => {
      console.log(`Received ${locations.length} locations`)
      for (const location of locations) {
        this.locations.push(location)
      }
    }, MapComponent.TYPE)
  }

  public ngAfterViewInit() {
    this.dispatchStaticCanvases()

    setInterval(() => {
      this.refresh(Date.now())
    }, 1000 / this.configService.get('fps'))
  }

  private calculateSize() {
    this.viewportService.getWidth()
      .subscribe((width) => {
        for (let canvas of this.staticCanvas) {
          canvas.bubbleCanvas.width = width
          canvas.shadowCanvas.width = width
          this.animated.nativeElement.width = width
        }
      })

    this.viewportService.getHeight()
      .subscribe((height) => {
        for (let canvas of this.staticCanvas) {
          canvas.bubbleCanvas.height = height
          canvas.shadowCanvas.height = height
          this.animated.nativeElement.height = height
        }
      })
  }

  private refresh(currentTimestamp: number = null) {

    if ((typeof this.globalCounter === 'number') && this.locations.length > 0) {
      this.hideLoader()

      let current = this.locations[0]

      if (!this.startTimestamp) {
        this.startTimestamp = currentTimestamp
      }

      let gapTimestamp = currentTimestamp - this.startTimestamp
      if (!this.startTime) {
        this.startTime = current.time
      }

      let gapTime = current.time - this.startTime
      let locationsToAdd = []
      while ((gapTime < gapTimestamp) && (this.locations.length > 1)) {
        locationsToAdd.push(current)
        this.locations.shift()
        current = this.locations[0]
        gapTime = current.time - this.startTime
        this.globalCounter++
      }

      this.time = moment(current.time).format('HH:mm:ss')

      const canvasIndex = Math.floor(this.staticCanvas.length * (new Date(current.time)).getMinutes() / 60)
      const opacityStep = 1 / (this.staticCanvas.length - 1)
      for (let j = 0; j < this.staticCanvas.length; ++j) {
        this.staticCanvas[(j + 1) % this.staticCanvas.length].bubbleCanvas.style.opacity = opacityStep * ((j - canvasIndex + this.staticCanvas.length) % this.staticCanvas.length)
        this.staticCanvas[(j + 1) % this.staticCanvas.length].shadowCanvas.style.opacity = opacityStep * ((j - canvasIndex + this.staticCanvas.length) % this.staticCanvas.length)
      }

      const previousCanvasIndex = (canvasIndex + 1) % this.staticCanvas.length
      this.staticCanvas[previousCanvasIndex].bubbleContext.clearRect(0, 0, this.staticCanvas[previousCanvasIndex].bubbleCanvas.width, this.staticCanvas[previousCanvasIndex].bubbleCanvas.height)
      this.staticCanvas[previousCanvasIndex].shadowContext.clearRect(0, 0, this.staticCanvas[previousCanvasIndex].shadowCanvas.width, this.staticCanvas[previousCanvasIndex].shadowCanvas.height)

      this.addStaticPoint(canvasIndex, current.latitude, current.longitude)
      this.addAnimatedPoint(current.latitude, current.longitude)
    }

  }

  private dispatchStaticCanvases() {
    let shadowCanvases = this.canvasShadow.nativeElement.querySelectorAll('canvas')
    for (let index: number = 0 ; index < shadowCanvases.length; ++index) {
      let shadowCanvas = <HTMLCanvasElement> shadowCanvases[index]
      shadowCanvas.height = this.viewportService.getHeight().getValue()
      shadowCanvas.width = this.viewportService.getWidth().getValue()
      this.staticCanvas[index] = this.staticCanvas[index] || {}
      this.staticCanvas[index].shadowCanvas = shadowCanvas
      this.staticCanvas[index].shadowContext = shadowCanvas.getContext('2d')
    }

    let bubbleCanvases = this.canvasBubble.nativeElement.querySelectorAll('canvas')
    for (let index: number = 0 ; index < bubbleCanvases.length; ++index) {
      let bubbleCanvas = <HTMLCanvasElement> bubbleCanvases[index]
      bubbleCanvas.height = this.viewportService.getHeight().getValue()
      bubbleCanvas.width = this.viewportService.getWidth().getValue()
      this.staticCanvas[index] = this.staticCanvas[index] || {}
      this.staticCanvas[index].bubbleCanvas = bubbleCanvas
      this.staticCanvas[index].bubbleContext = bubbleCanvas.getContext('2d')
    }
  }

  private addStaticPoint(index, lat, lng) {
    const strokeColor = this.configService.get('point.stroke')
    const fillColor = this.configService.get('point.fill')
    const strokeWidth = this.configService.get('point.width')

    let coordinates = this.getTranslate(lat, lng)
    let staticContextBubble = this.staticCanvas[index].bubbleContext
    staticContextBubble.beginPath()
    staticContextBubble.fillStyle = fillColor
    staticContextBubble.arc(coordinates.x, coordinates.y, strokeWidth, 0, 2 * Math.PI, false)
    staticContextBubble.fill()

    let staticContextShadow = this.staticCanvas[index].shadowContext
    staticContextShadow.beginPath()
    staticContextShadow.fillStyle = strokeColor
    staticContextShadow.arc(coordinates.x - strokeWidth, coordinates.y - strokeWidth, strokeWidth * 2, 0, 2 * Math.PI, false)
    staticContextShadow.lineWidth = strokeWidth
    staticContextShadow.strokeStyle = strokeColor
    staticContextShadow.fill()
    staticContextShadow.stroke()
  }

  private addAnimatedPoint(lat: number, lng: number): void {
    const strokeColor = this.configService.get('point.cursor')
    const coordinates = this.getTranslate(lat, lng)
    const animatedCanvasBubble: HTMLCanvasElement = <HTMLCanvasElement> this.animated.nativeElement
    const animatedContextBubble: CanvasRenderingContext2D = animatedCanvasBubble.getContext('2d')
    animatedContextBubble.clearRect(0, 0, animatedCanvasBubble.width, animatedCanvasBubble.height)
    animatedContextBubble.beginPath()
    animatedContextBubble.strokeStyle = strokeColor
    animatedContextBubble.lineWidth = .2
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

  private getTranslate(lat, lng) {
    let x = (lng + 180) * (this.viewportService.getWidth().getValue() / 360)
    let y = (lat - 90) / -180 * this.viewportService.getHeight().getValue()
    return { x: x, y: y }
  }

  private hideLoader() {
    if (this.isLoaderDisplayed) {
      this.calculateSize()
      this.isLoaderDisplayed = false
    }
  }
}
