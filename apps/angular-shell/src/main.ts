import { createCustomElement } from '@angular/elements';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AtlaskitEditorHostComponent } from './app/atlaskit-editor-host.component';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => {
    const tagName = 'atlas-angular-editor';

    if (!customElements.get(tagName)) {
      customElements.define(
        tagName,
        createCustomElement(AtlaskitEditorHostComponent, {
          injector: appRef.injector
        })
      );
    }
  })
  .catch((error: unknown) => {
    console.error(error);
  });
