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
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ProfileLinkImageBackendApiService } from './profile-link-image-backend-api.service';
import { ProfileLinkImageComponent } from './profile-link-image.component';

/**
 * @fileoverview Unit tests for ProfileLinkImageComponent
 */

describe('ProfileLinkImageComponent', () => {
  let component: ProfileLinkImageComponent;
  let fixture: ComponentFixture<ProfileLinkImageComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let profileLinkImageBackendApiService: ProfileLinkImageBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ProfileLinkImageComponent
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileLinkImageComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    profileLinkImageBackendApiService = TestBed.inject(
      ProfileLinkImageBackendApiService);
  });

  it('should get profile picture data on initialization', fakeAsync(() => {
    component.username = 'user1';
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      'default-image-url');

    spyOn(profileLinkImageBackendApiService, 'fetchProfilePictureDataAsync')
      .and.returnValue(Promise.resolve('base64-profile-picture'));

    component.ngOnInit();
    tick();

    expect(component.profileImageUrl).toBe(
      '/preferenceshandler/profile_picture_by_username/user1');
    expect(component.profilePicture).toBe('base64-profile-picture');
  }));

  it('should get default profile picture if user\' profile picture data is' +
    ' not available', fakeAsync(() => {
    component.username = 'user1';
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      'default-image-url');

    spyOn(profileLinkImageBackendApiService, 'fetchProfilePictureDataAsync')
      .and.returnValue(Promise.resolve(null));

    component.ngOnInit();
    tick();
    expect(component.profilePicture).toBe('default-image-url');
  }));

  it('should check if username is linkable', () => {
    let usernamesNotLinkable = ['admin', 'OppiaMigrationBot'];

    expect(component.isUsernameLinkable(usernamesNotLinkable[0])).toBe(false);
    expect(component.isUsernameLinkable(usernamesNotLinkable[1])).toBe(false);
    expect(component.isUsernameLinkable('linkableUsername')).toBe(true);
  });
});
