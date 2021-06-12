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

/**
 * @fileoverview Tests for audio-file-uploader component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AudioFileUploaderComponent } from './audio-file-uploader.component';

describe('Audio File Uploader Component', () => {
  let component: AudioFileUploaderComponent;
  let fixture:
    ComponentFixture<AudioFileUploaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AudioFileUploaderComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture =
      TestBed.createComponent(AudioFileUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });

  it('should validate files correctly', () => {
    let mockFile = new File(['foo'], 'audio.mp3', {
      type: 'audio/mpeg',
    });
    expect(component.validateUploadedFile(mockFile))
      .toEqual(null);
    expect(component.validateUploadedFile(null))
      .toEqual('No audio file was uploaded.');
    mockFile = new File(['foo'], 'audio.mp3', {
      type: 'other than audio'
    });
    expect(component.validateUploadedFile(mockFile))
      .toEqual('Only the MP3 audio format is currently supported.');
    mockFile = new File(['foo'], '', {
      type: 'audio/mpeg',
    });
    expect(component.validateUploadedFile(mockFile))
      .toEqual('Filename must not be empty.');
    mockFile = new File(['foo'], 'video.mp4', {
      type: 'audio/mpeg',
    });
    expect(component.validateUploadedFile(mockFile))
      .toEqual('This audio format does not match the filename extension.');
    mockFile = new File(['foo'], 'video.mp4', {
      type: 'png',
    });
    expect(component.validateUploadedFile(mockFile))
      .toEqual('This file is not recognized as an audio file.');
  });

  it('should upload an audio file', () => {
    let files = [
      new File(['foo'], 'audio.mp3', {
        type: 'audio/mpeg',
      }),
      new File(['bar'], 'audio.mp3', {
        type: 'audio/mp3',
      })
    ];
    component.fileInputRef.nativeElement = {
      files: files
    };
    spyOn(component.fileChange, 'emit');
    spyOn(component.fileClear, 'emit');

    component.addAudio(new Event('add'));

    expect(component.fileChange.emit).toHaveBeenCalledWith(files[0]);
    expect(component.fileClear.emit).not.toHaveBeenCalled();
  });

  it('should not upload if the audio file is not valid', () => {
    component.fileInputRef.nativeElement = {
      files: [
        new File(['foo'], 'audio.mp4', {
          type: 'audio/mp4',
        })
      ]
    };
    spyOn(component.fileClear, 'emit');
    spyOn(component.fileChange, 'emit');

    component.addAudio(new Event('add'));

    expect(component.fileClear.emit).toHaveBeenCalled();
    expect(component.fileChange.emit).not.toHaveBeenCalled();
  });

  it('should reset the uploader if no file is uploaded by the user', () => {
    component.fileInputRef.nativeElement = {
      files: []
    };
    spyOn(component.fileClear, 'emit');
    spyOn(component.fileChange, 'emit');

    component.addAudio(new Event('add'));

    expect(component.fileClear.emit).toHaveBeenCalled();
    expect(component.fileChange.emit).not.toHaveBeenCalled();
  });
});
