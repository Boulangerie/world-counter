import { NgModule } from '@angular/core'
import { DataService } from './data.service'
import { ConfigService } from './config.service'
import { ViewportService } from './viewport.service'
import { LocationService } from './location.service'

@NgModule({
  providers: [DataService, ConfigService, ViewportService, LocationService]
})
export class CoreModule { }
