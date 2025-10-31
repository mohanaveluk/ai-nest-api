import {
  Controller,
  Get,
  MessageEvent,
  Sse,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('upload-events')
export class UploadGateway {
  private progressSubject = new Subject<{ fileName: string; progress: number }>();

  /**
   * SSE endpoint to subscribe to upload progress
   */
  @Sse('progress')
  sendProgress(): Observable<MessageEvent> {
    return this.progressSubject.asObservable().pipe(
      map((data) => ({
        type: 'progress',
        data,
      })),
    );
  }

  /**
   * Emit progress update
   * @param fileName Name of the file being uploaded
   * @param progress Upload progress percentage
   */
  emitProgress(fileName: string, progress: number) {
    this.progressSubject.next({ fileName, progress });
  }
}