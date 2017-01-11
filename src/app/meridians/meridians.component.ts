import * as _ from 'lodash'
import * as moment from 'moment'
import { Component } from '@angular/core'

@Component({
  selector: 'app-meridians',
  templateUrl: './meridians.component.html',
  styleUrls: ['./meridians.component.scss']
})
export class MeridiansComponent {

  public meridians: Array<string>
  public currentMeridian: string

  public constructor() {
    const offset: number = moment().utcOffset() / 60
    this.currentMeridian = `GMT${offset >= 0 ? '+' : ''}${offset}`

    this.meridians = _(-12)
      .range(13)
      .map((val) => {
        return `GMT${val >= 0 ? '+' : ''}${val}`
      })
      .value()
  }

}
