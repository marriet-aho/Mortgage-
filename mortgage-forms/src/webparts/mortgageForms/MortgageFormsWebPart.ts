import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'MortgageFormsWebPartStrings';
import { FormsApp } from '../../app/App';
import { SharePointFormStore } from '../../app/sharePointFormStore';

export interface IMortgageFormsWebPartProps {
  documentLibrary: string;
  advanceFlowUrl: string;
}

/**
 * Digital Mortgage Forms for Advance Flow. Runs entirely inside SharePoint Online with the signed-in user's
 * Microsoft identity: no API of its own. Drafts and finished forms are saved in a document library.
 */
export default class MortgageFormsWebPart extends BaseClientSideWebPart<IMortgageFormsWebPartProps> {
  public render(): void {
    const u = this.context.pageContext.user;
    const userKey = (u.loginName || u.email || u.displayName).replace(/[^A-Za-z0-9._@-]/g, '_');
    const store = new SharePointFormStore(
      this.context.spHttpClient,
      this.context.pageContext.web.absoluteUrl,
      this.context.pageContext.web.serverRelativeUrl,
      this.properties.documentLibrary || 'Mortgage Forms',
      userKey
    );
    ReactDom.render(React.createElement(FormsApp, { store, userName: u.displayName, userEmail: u.email, advanceFlowUrl: this.properties.advanceFlowUrl }), this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [{
        header: { description: strings.PropertyPaneDescription },
        groups: [{
          groupName: strings.SettingsGroupName,
          groupFields: [
            PropertyPaneTextField('documentLibrary', { label: strings.DocumentLibraryFieldLabel }),
            PropertyPaneTextField('advanceFlowUrl', { label: strings.AdvanceFlowUrlFieldLabel })
          ]
        }]
      }]
    };
  }
}
