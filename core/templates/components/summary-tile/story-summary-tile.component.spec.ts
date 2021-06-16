// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { StorySummaryTileComponent } from './story-summary-tile.component';

/**
 * @fileoverview Unit tests for StorySummaryTileComponent.
 */

describe('StorySummaryTileComponent', () => {
  let component: StorySummaryTileComponent;
  let fixture: ComponentFixture<StorySummaryTileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StorySummaryTileComponent,
        MockTranslatePipe
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StorySummaryTileComponent);
    component = fixture.componentInstance;
  });
});