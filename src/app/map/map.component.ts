import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as io from 'socket.io-client';
import { DataSource, DataService } from '../core/data.service'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  private static COLOR_THEME: string = 'teads'; // teads, copper, space
  private static TIME_INTERVAL: number = 50;

  public isLoaderDisplayed: boolean = true

  private dataService: DataService

  private locations: any;
  private globalCounter: any;
  private displayedLocations;
  private startTimestamp;
  private startTime;
  private mapWidth;
  private mapHeight;
  private staticCanvas = [];
  private numberOfStaticCanvas = 6;
  private animatedCanvasBubble: any;
  private animatedContextBubble: any;

  constructor(dataService: DataService) {
    this.dataService = dataService
    this.locations = [];
    this.displayedLocations = [];
    this.globalCounter = 0;
  }

  ngOnInit() {
  }

  ngAfterViewInit() {

    this.animatedCanvasBubble = document.getElementById('animated');
    this.animatedContextBubble = this.animatedCanvasBubble.getContext('2d');

    this.getStaticCanvases();

    // this.refresh();
    setInterval(() => {
      this.refresh(Date.now())
    }, MapComponent.TIME_INTERVAL)

    this.calculateSize();

    // for (let i = 0; i < this.numberOfStaticCanvas; ++i) {
    //   this.createStaticCanvas();
    // }

    this.dataService.setSource(DataSource.MOCK)
    this.dataService.subscribe((locations) => {
      this.locations.push(...locations)
    })

    window.addEventListener('resize', this.calculateSize);
  }

  calculateSize() {
    this.mapHeight = document.querySelectorAll('#background')[0].getBoundingClientRect().height;
    this.mapWidth = document.querySelectorAll('#background')[0].getBoundingClientRect().width;

    (<HTMLCanvasElement> document.querySelectorAll('#animated')[0]).height = this.mapHeight;
    (<HTMLCanvasElement> document.querySelectorAll('#animated')[0]).width = this.mapWidth;
    (<HTMLElement> document.querySelectorAll('#sun-0')[0]).style.height = this.mapHeight + 'px';
    (<HTMLElement> document.querySelectorAll('#sun-0')[0]).style.width = this.mapWidth + 'px';
    (<HTMLElement> document.querySelectorAll('#sun-1')[0]).style.height = this.mapHeight + 'px';
    (<HTMLElement> document.querySelectorAll('#sun-1')[0]).style.width = this.mapWidth + 'px';
    (<HTMLElement> document.querySelectorAll('#sun-2')[0]).style.height = this.mapHeight + 'px';
    (<HTMLElement> document.querySelectorAll('#sun-2')[0]).style.width = this.mapWidth + 'px';

    for (let canvas of this.staticCanvas) {
      canvas.bubbleCanvas.width = this.mapWidth;
      canvas.shadowCanvas.height = this.mapHeight;
    }
  }

  refresh(currentTimestamp: number = null) {

    if (this.locations.length > 0) {
      this.hideLoader();

      let current = this.locations[0];

      // Calculation
      if (!this.startTimestamp) {
        this.startTimestamp = currentTimestamp;
      }

      let gapTimestamp = currentTimestamp - this.startTimestamp;
      if (!this.startTime) {
        this.startTime = current.time;
      }

      let gapTime = current.time - this.startTime;
      let locationsToAdd = [];
      while ((gapTime < gapTimestamp) && (this.locations.length > 1)) {
        locationsToAdd.push(current);
        this.locations.shift();
        current = this.locations[0];
        gapTime = current.time - this.startTime;
        this.globalCounter++;
      }

      // Rendering
      document.getElementById('time').innerText = moment(current.time).format('HH:mm:ss.SSS');
      document.getElementById('counter').innerText = this.globalCounter;

      var sunCoordinates = this.getSunPosition(current.time / 1000);
      (<HTMLCanvasElement> document.querySelectorAll('#sun-0')[0]).style.backgroundImage = 'radial-gradient(ellipse 70% 280% at ' + (this.mapWidth / 2) + 'px ' + Math.round(sunCoordinates.y) + 'px, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.2) 40%, rgba(0, 0, 0, 0.4) 42%, rgba(0, 0, 0, 0.6) 44%)';
      (<HTMLCanvasElement> document.querySelectorAll('#sun-0')[0]).style.left = Math.round(sunCoordinates.x - (this.mapWidth / 2) - this.mapWidth) + 'px';
      (<HTMLCanvasElement> document.querySelectorAll('#sun-1')[0]).style.backgroundImage = 'radial-gradient(ellipse 70% 280% at ' + (this.mapWidth / 2) + 'px ' + Math.round(sunCoordinates.y) + 'px, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.2) 40%, rgba(0, 0, 0, 0.4) 42%, rgba(0, 0, 0, 0.6) 44%)';
      (<HTMLCanvasElement> document.querySelectorAll('#sun-1')[0]).style.left = Math.round(sunCoordinates.x - (this.mapWidth / 2)) + 'px';
      (<HTMLCanvasElement> document.querySelectorAll('#sun-2')[0]).style.backgroundImage = 'radial-gradient(ellipse 70% 280% at ' + (this.mapWidth / 2) + 'px ' + Math.round(sunCoordinates.y) + 'px, rgba(0, 0, 0, 0) 38%, rgba(0, 0, 0, 0.2) 40%, rgba(0, 0, 0, 0.4) 42%, rgba(0, 0, 0, 0.6) 44%)';
      (<HTMLCanvasElement> document.querySelectorAll('#sun-2')[0]).style.left = Math.round(sunCoordinates.x + (this.mapWidth / 2)) + 'px';

      var canvasIndex = Math.floor(this.staticCanvas.length * (new Date(current.time)).getMinutes() / 60);
      var opacityStep = 1 / (this.staticCanvas.length - 1);
      for (var j = 0; j < this.staticCanvas.length; ++j) {
        this.staticCanvas[(j + 1) % this.staticCanvas.length].bubbleCanvas.style.opacity = opacityStep * ((j - canvasIndex + this.staticCanvas.length) % this.staticCanvas.length);
        this.staticCanvas[(j + 1) % this.staticCanvas.length].shadowCanvas.style.opacity = opacityStep * ((j - canvasIndex + this.staticCanvas.length) % this.staticCanvas.length);
      }

      var previousCanvasIndex = (canvasIndex + 1) % this.staticCanvas.length;
      this.staticCanvas[previousCanvasIndex].bubbleContext.clearRect(0, 0, this.staticCanvas[previousCanvasIndex].bubbleCanvas.width, this.staticCanvas[previousCanvasIndex].bubbleCanvas.height);
      this.staticCanvas[previousCanvasIndex].shadowContext.clearRect(0, 0, this.staticCanvas[previousCanvasIndex].shadowCanvas.width, this.staticCanvas[previousCanvasIndex].shadowCanvas.height);

      this.addStaticPoint(canvasIndex, current.latitude, current.longitude);
      this.addAnimatedPoint(current.latitude, current.longitude);
    }

  }

  getStaticCanvases() {
    let shadowCanvases = document.querySelectorAll('#canvas-shadow canvas')
    for (let index: number = 0 ; index < shadowCanvases.length; ++index) {
      let shadowCanvas = <HTMLCanvasElement> shadowCanvases[index]
      shadowCanvas.height = this.mapHeight
      shadowCanvas.width = this.mapWidth
      this.staticCanvas[index] = this.staticCanvas[index] || {}
      this.staticCanvas[index].shadowCanvas = shadowCanvas
      this.staticCanvas[index].shadowContext = shadowCanvas.getContext('2d')
    }

    let bubbleCanvases = document.querySelectorAll('#canvas-bubble canvas')
    for (let index: number = 0 ; index < bubbleCanvases.length; ++index) {
      let bubbleCanvas = <HTMLCanvasElement> bubbleCanvases[index]
      bubbleCanvas.height = this.mapHeight
      bubbleCanvas.width = this.mapWidth
      this.staticCanvas[index] = this.staticCanvas[index] || {}
      this.staticCanvas[index].bubbleCanvas = bubbleCanvas
      this.staticCanvas[index].bubbleContext = bubbleCanvas.getContext('2d')
    }
  }

  createStaticCanvas() {
    let staticCanvasShadow = document.createElement('canvas');
    staticCanvasShadow.id = 'static-' + this.staticCanvas.length;
    let staticContextShadow = staticCanvasShadow.getContext('2d');
    staticCanvasShadow.height = this.mapHeight;
    staticCanvasShadow.width = this.mapWidth;
    document.getElementById('canvas-shadow').appendChild(staticCanvasShadow);

    let staticCanvasBubble = document.createElement('canvas')
    staticCanvasBubble.id = 'static-' + this.staticCanvas.length
    let staticContextBubble = staticCanvasBubble.getContext('2d')
    staticCanvasBubble.height = this.mapHeight
    staticCanvasBubble.width = this.mapWidth
    document.getElementById('canvas-bubble').appendChild(staticCanvasBubble)

    this.staticCanvas.push({
      bubbleCanvas: staticCanvasBubble,
      bubbleContext: staticContextBubble,
      shadowCanvas: staticCanvasShadow,
      shadowContext: staticContextShadow
    })
  }

  addStaticPoint(index, lat, lng) {
    let coordinates = this.getTranslate(lat, lng);
    let staticContextBubble = this.staticCanvas[index].bubbleContext;
    staticContextBubble.beginPath();
    staticContextBubble.fillStyle = this.getColor();
    staticContextBubble.arc(coordinates.x, coordinates.y, .2, 0, 2 * Math.PI, false);
    staticContextBubble.fill();

    let staticContextShadow = this.staticCanvas[index].shadowContext;
    staticContextShadow.beginPath();
    staticContextShadow.fillStyle = this.getColor(true);
    staticContextShadow.arc(coordinates.x, coordinates.y, .2, 0, 2 * Math.PI, false);
    staticContextShadow.lineWidth = .2;
    staticContextShadow.strokeStyle = this.getColor(true);
    staticContextShadow.fill();
    staticContextShadow.stroke();
  }

  addAnimatedPoint(lat, lng) {
    let coordinates = this.getTranslate(lat, lng);
    this.animatedContextBubble.clearRect(0, 0, this.animatedCanvasBubble.width, this.animatedCanvasBubble.height);
    this.animatedContextBubble.beginPath();
    this.animatedContextBubble.strokeStyle = this.getColor();
    this.animatedContextBubble.lineWidth = .2;
    this.animatedContextBubble.moveTo(0, coordinates.y);
    this.animatedContextBubble.lineTo(this.animatedCanvasBubble.width, coordinates.y);
    this.animatedContextBubble.moveTo(coordinates.x, 0);
    this.animatedContextBubble.lineTo(coordinates.x, this.animatedCanvasBubble.height);
    this.animatedContextBubble.stroke();
    this.animatedContextBubble.beginPath();
    this.animatedContextBubble.lineWidth = .3;
    this.animatedContextBubble.rect(coordinates.x - 5, coordinates.y - 5, 10, 10);
    this.animatedContextBubble.stroke();
  }

  getTranslate(lat, lng) {
    let x = (lng + 180) * (this.mapWidth / 360)
    let y = (lat - 90) / -180 * this.mapHeight
    return { x: x, y: y }
  }

  getSunPosition(time) {
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

  getColor(shadow: boolean = false) {
    let color = 'white';
    if (!shadow) {
      switch (MapComponent.COLOR_THEME) {
        case 'space':
          color = 'lightyellow'
          break
        case 'copper':
          color = 'peachpuff'
          break
        case 'teads':
          color = 'lightcyan'
          break
      }
    } else {
      switch (MapComponent.COLOR_THEME) {
        case 'space':
          color = 'gold'
          break
        case 'copper':
          color = 'orangered'
          break
        case 'teads':
          color = '#1fc5cf'
          break
      }
    }
    return color
  }

  hideLoader() {
    this.calculateSize();
    if (this.isLoaderDisplayed) {
      this.isLoaderDisplayed = false
    }
  }
}
