import { NgModule } from '@angular/core'
import { DataService } from './data.service'
import { ConfigService } from './config.service'
import { ViewportService } from './viewport.service'
import { LocationService } from './location.service'
import { CursorFactory } from '../map/cursor/cursor.factory'

@NgModule({
  providers: [DataService, ConfigService, ViewportService, LocationService, CursorFactory]
})
export class CoreModule { }
