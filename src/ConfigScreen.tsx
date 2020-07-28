import React, { Component } from "react";
import { AppExtensionSDK } from "contentful-ui-extensions-sdk";
import {
  Heading,
  Form,
  Workbench,
  Select,
  Option,
} from "@contentful/forma-36-react-components";
import { css } from "emotion";

export interface AppInstallationParameters {
  defaultValue: string;
}

interface ConfigProps {
  sdk: AppExtensionSDK;
}

interface ConfigState {
  parameters: AppInstallationParameters;
  contentTypes: any[];
  selectedContentType: string;
}

export default class Config extends Component<ConfigProps, ConfigState> {
  constructor(props: ConfigProps) {
    super(props);
    this.state = {
      contentTypes: [],
      selectedContentType: "",
      parameters: { defaultValue: "" },
    };

    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    props.sdk.app.onConfigure(() => this.onConfigure());
  }

  async getContentTypesUsingEditor(): Promise<any> {
    const { space, ids } = this.props.sdk;
    const editorInterfaces = await space.getEditorInterfaces();

    const appId = ids.app;

    const appIncludedInEditors = (appId: any, editorInterface: any) => {
      if (editorInterface.editor) {
        return appId === editorInterface.editor.widgetId;
      } else if (editorInterface.editors) {
        return editorInterface.editors.some(
          ({ widgetId }: any) => widgetId === appId
        );
      }
    };

    const entryIds: any = editorInterfaces.items.reduce(
      (contentTypes, editorInterface: any) => {
        if (appIncludedInEditors(appId, editorInterface)) {
          const contentTypeId = editorInterface.sys?.contentType?.sys?.id;
          return contentTypes.concat(contentTypeId);
        }
        return contentTypes;
      },
      []
    );

    const entries = await Promise.all(
      entryIds.map((id: string) => space.getContentType(id))
    );

    return entries;
  }

  async componentDidMount() {
    // Get current parameters of the app.
    // If the app is not installed yet, `parameters` will be `null`.
    const parameters: AppInstallationParameters | null = await this.props.sdk.app.getParameters();
    const contentTypes = await this.getContentTypesUsingEditor();

    this.setState(
      parameters
        ? {
            parameters,
            contentTypes,
            selectedContentType: contentTypes[0]?.sys.id,
          }
        : this.state,
      () => {
        // Once preparation has finished, call `setReady` to hide
        // the loading screen and present the app to a user.
        this.props.sdk.app.setReady();
      }
    );
  }

  render() {
    return (
      <Workbench className={css({ margin: "80px" })}>
        <Form>
          <Heading>Field Group Set Up Config</Heading>
          <Select
            value={this.state.selectedContentType}
            onChange={(e: any) => {
              // @ts-ignore
              this.setState({ selectedContentType: e.target.value });
            }}
          >
            {this.state.contentTypes.map((ct) => (
              <Option key={ct.sys.id} value={ct.sys.id}>
                {ct.name}
              </Option>
            ))}
          </Select>
        </Form>
        <div>
          here appears the group editors for selected thing{" "}
          <span>{this.getInterface(this.state.selectedContentType)}</span>
        </div>
      </Workbench>
    );
  }

  getInterface(x: string): string {
    return this.state.contentTypes.find((ct) => ct.sys.id === x)?.name ?? "";
  }

  async onConfigure() {
    const { space, ids } = this.props.sdk;
    const editorInterfaces = await space.getEditorInterfaces();

    const appId = ids.app;

    const appIncludedInEditors = (appId: any, editorInterface: any) => {
      if (editorInterface.editor) {
        return appId === editorInterface.editor.widgetId;
      } else if (editorInterface.editors) {
        return editorInterface.editors.some(
          ({ widgetId }: any) => widgetId === appId
        );
      }
    };

    console.log("I need to set up the tabs and stuff better");
    const contentTypesUsingApp = editorInterfaces.items.reduce(
      (contentTypes, editorInterface: any) => {
        if (appIncludedInEditors(appId, editorInterface)) {
          const contentTypeId = editorInterface.sys?.contentType?.sys?.id;
          return contentTypes.concat(contentTypeId);
        }
        return contentTypes;
      },
      []
    );

    const EditorInterface = contentTypesUsingApp.reduce(
      (edInt, contentTypeId) => {
        return { ...edInt, [contentTypeId]: { editor: true } };
      },
      {}
    );

    return {
      parameters: this.state.parameters,
      targetState: {
        EditorInterface,
      },
    };
  }
}
