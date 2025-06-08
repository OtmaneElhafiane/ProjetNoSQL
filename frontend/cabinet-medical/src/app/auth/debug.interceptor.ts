import { HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export function DebugInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  console.log('🚀 Requête HTTP:', {
    method: req.method,
    url: req.url,
    headers: headersToObject(req.headers),
    body: req.body
  });

  return next(req).pipe(
    tap(
      event => {
        if (event instanceof HttpResponse) {
          console.log('✅ Réponse HTTP:', {
            status: event.status,
            url: event.url,
            body: event.body
          });
        }
      },
      error => {
        if (error instanceof HttpErrorResponse) {
          console.error('❌ Erreur HTTP:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            error: error.error
          });
        }
      }
    )
  );
}

function headersToObject(headers: any): any {
  const headersObj: any = {};
  headers.keys().forEach((key: string) => {
    headersObj[key] = headers.get(key);
  });
  return headersObj;
} 