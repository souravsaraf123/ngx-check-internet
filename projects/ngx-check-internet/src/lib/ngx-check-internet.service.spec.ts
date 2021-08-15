import { TestBed } from '@angular/core/testing';

import { NgxCheckInternetService } from './ngx-check-internet.service';

describe('NgxCheckInternetService', () => {
  let service: NgxCheckInternetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxCheckInternetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
