import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable()
export class ViewportService {

  public width: BehaviorSubject<number>
  public height: BehaviorSubject<number>

  public constructor() {
    this.width = new BehaviorSubject<number>(0)
    this.height = new BehaviorSubject<number>(0)
  }

  public getWidth(): BehaviorSubject<number> {
    return this.width
  }

  public getHeight(): BehaviorSubject<number> {
    return this.height
  }

}
