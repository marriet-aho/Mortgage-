import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneDropdown, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { AadHttpClient, IHttpClientOptions } from '@microsoft/sp-http';

import * as strings from 'MortgageAcceleratorWebPartStrings';
import { MortgageApp } from '../../app/App';
import { AdvanceFlowClient } from '../../app/services/client';
import { FileStore } from '../../app/services/fileStore';
import { Fetcher, HttpAdvanceFlowClient } from '../../app/services/httpClient';
import { SharePointFileStore } from '../../app/services/sharePointFileStore';

export interface IMortgageAcceleratorWebPartProps {
  /** For example https://advanceflow.contoso.com/api/mortgage */
  apiBaseUrl: string;
  /** The App ID URI of the Advance Flow API registration in Microsoft Entra ID. */
  apiResourceUri: string;
  documentLibrary: string;
  defaultRoute: string;
}

/**
 * Hosts the whole Mortgage Accelerator module. It authenticates to Advance Flow with the signed-in
 * user's Microsoft Entra ID identity (AadHttpClient) and stores documents in SharePoint Online.
 * Place it on a full-width "Single-part app" page, or on separate pages with a different "Open on" route.
 */
export default class MortgageAcceleratorWebPart extends BaseClientSideWebPart<IMortgageAcceleratorWebPartProps> {
  private client: AdvanceFlowClient | undefined;
  private files: FileStore | undefined;
  private error: string | undefined;

  protected async onInit(): Promise<void> {
    const p = this.properties;
    if (!p.apiBaseUrl || !p.apiResourceUri) {
      this.error = 'Set the Advance Flow API address and resource in the web part properties.';
      return;
    }
    try {
      const aad = await this.context.aadHttpClientFactory.getClient(p.apiResourceUri);
      const base = p.apiBaseUrl.replace(/\/$/, '');
      const fetcher: Fetcher = (path, init) => aad.fetch(base + path, AadHttpClient.configurations.v1, init as IHttpClientOptions);
      this.client = new HttpAdvanceFlowClient(fetcher);
      this.files = new SharePointFileStore(
        this.context.spHttpClient,
        this.context.pageContext.web.absoluteUrl,
        this.context.pageContext.web.serverRelativeUrl,
        p.documentLibrary || 'Case Documents'
      );
    } catch (e) {
      this.error = 'Could not connect to Advance Flow: ' + (e instanceof Error ? e.message : String(e));
    }
  }

  public render(): void {
    if (!this.client || !this.files) {
      this.domElement.innerHTML = '<div style="padding:16px;border:1px solid #F6B48A;background:#FDEEE3;border-radius:8px;font-family:Segoe UI,sans-serif">' +
        '<b>Mortgage Accelerator is not connected.</b><div>' + (this.error || '') + '</div></div>';
      return;
    }
    const element = React.createElement(MortgageApp, { client: this.client, files: this.files, defaultRoute: this.properties.defaultRoute || '/' });
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.ConnectionGroupName,
              groupFields: [
                PropertyPaneTextField('apiBaseUrl', { label: strings.ApiBaseUrlFieldLabel }),
                PropertyPaneTextField('apiResourceUri', { label: strings.ApiResourceUriFieldLabel })
              ]
            },
            {
              groupName: strings.PageGroupName,
              groupFields: [
                PropertyPaneTextField('documentLibrary', { label: strings.DocumentLibraryFieldLabel }),
                PropertyPaneDropdown('defaultRoute', {
                  label: strings.DefaultRouteFieldLabel,
                  options: [
                    { key: '/', text: 'Home' }, { key: '/cases', text: 'Case management' }, { key: '/apply/purchase', text: 'Home Purchase wizard' },
                    { key: '/apply/equity', text: 'Equity Release wizard' }, { key: '/hub', text: 'Collaboration hub' }, { key: '/valuations', text: 'Valuations' },
                    { key: '/fit-to-lend', text: 'Fit-to-lend workspace' }, { key: '/conditions', text: 'Conditions tracker' },
                    { key: '/dashboard', text: 'Mortgage dashboard' }, { key: '/executive', text: 'Executive dashboard' }, { key: '/analytics', text: 'Analytics' }
                  ]
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
