import { Routes } from '@angular/router'
import { MapComponent } from './map/map.component'

export const appRoutes: Routes = [
  { path: '', component: MapComponent },
  { path: '**', redirectTo: '/', pathMatch: 'full' }
]
