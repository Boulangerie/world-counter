/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MeridiansComponent } from './meridians.component';

describe('MeridiansComponent', () => {
  let component: MeridiansComponent;
  let fixture: ComponentFixture<MeridiansComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MeridiansComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeridiansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
