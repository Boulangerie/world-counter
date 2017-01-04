import { Component, AfterViewChecked } from '@angular/core';
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

    window.addEventListener('resize', this.calculateSize);
  }

  public ngAfterViewChecked() {
    this.calculateSize()
  }

  public calculateSize() {
    const rect = this.image.nativeElement.getBoundingClientRect()

    const height = rect.height
    const viewportHeight = this.viewportService.getHeight().getValue()
    if (viewportHeight !== height) {
      this.viewportService.getHeight().next(height)
    }

    const width = rect.width
    const viewportWidth = this.viewportService.getWidth().getValue()
    if (viewportWidth !== width) {
      this.viewportService.getWidth().next(width)
    }
  }
}
