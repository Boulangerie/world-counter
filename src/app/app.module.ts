import { BrowserModule } from '@angular/platform-browser'
import { NgModule, LOCALE_ID } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { HttpModule } from '@angular/http'
import { RouterModule } from '@angular/router'

import { appRoutes } from './app.routes'
import { AppComponent } from './app.component'
import { MapComponent } from './map/map.component'
import { CoreModule } from './core/core.module';
import { LoaderComponent } from './loader/loader.component';
import { SunComponent } from './sun/sun.component';
import { BackgroundComponent } from './background/background.component';
import { MeridiansComponent } from './meridians/meridians.component'

const userLang: string = window.navigator.language

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    LoaderComponent,
    SunComponent,
    BackgroundComponent,
    MeridiansComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
    CoreModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: userLang }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
