import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxCheckInternetComponent } from './ngx-check-internet.component';

describe('NgxCheckInternetComponent', () => {
  let component: NgxCheckInternetComponent;
  let fixture: ComponentFixture<NgxCheckInternetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgxCheckInternetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxCheckInternetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
