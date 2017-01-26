import { Component } from '@angular/core';
import { ConfigService } from '../core/config.service'
import { ViewChild } from '@angular/core/src/metadata/di'
import { ViewportService } from '../core/viewport.service'

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent {

  @ViewChild('image') public image

  public url: string
  private viewportService: ViewportService

  public constructor(viewportService: ViewportService, configService: ConfigService) {
    this.viewportService = viewportService
    this.url = configService.get('background.path') + configService.get('background.file')

    window.addEventListener('resize', this.calculateSize.bind(this))

    // @todo find a better way (or just a good one) to calculate background size after initialization
    window.setTimeout(this.calculateSize.bind(this), 1000)
  }

  public calculateSize(): void {
    if (this.image) {
      const rect: ClientRect = this.image.nativeElement.getBoundingClientRect()

      const height: number = rect.height
      const viewportHeight: number = this.viewportService.getHeight().getValue()
      if (viewportHeight !== height) {
        this.viewportService.getHeight().next(height)
      }

      const width: number = rect.width
      const viewportWidth: number = this.viewportService.getWidth().getValue()
      if (viewportWidth !== width) {
        this.viewportService.getWidth().next(width)
      }
    }
  }
}
