import { NgModule } from '@angular/core'
import { DataService } from './data.service'
import { ConfigService } from './config.service'
import { ViewportService } from './viewport.service'

@NgModule({
  providers: [DataService, ConfigService, ViewportService]
})
export class CoreModule { }
