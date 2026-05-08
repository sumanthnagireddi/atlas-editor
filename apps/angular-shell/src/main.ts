import { createCustomElement } from '@angular/elements';
import { bootstrapApplication } from '@angular/platform-browser';
import { AtlaskitEditorComponent } from '@sumanthnagireddi/atlas-angular';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => {
    const tagName = 'atlas-angular-editor';

    if (!customElements.get(tagName)) {
      customElements.define(
        tagName,
        createCustomElement(AtlaskitEditorComponent, {
          injector: appRef.injector
        })
      );
    }
  })
  .catch((error: unknown) => {
    console.error(error);
  });
