import { Routes } from '@angular/router'
import { MapComponent } from './map/map.component'

export const appRoutes: Routes = [
  { path: 'map', component: MapComponent },
  { path: '', redirectTo: '/map', pathMatch: 'full' },
  { path: '**', redirectTo: '/map', pathMatch: 'full' }
]
