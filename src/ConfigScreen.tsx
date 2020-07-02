import React, { Component } from "react";
import { AppExtensionSDK } from "contentful-ui-extensions-sdk";
import { TextField, Heading, Form, Workbench } from "@contentful/forma-36-react-components";
import { css } from "emotion";

export interface AppInstallationParameters {
  defaultValue: string;
}

interface ConfigProps {
  sdk: AppExtensionSDK;
}

interface ConfigState {
  parameters: AppInstallationParameters;
}

export default class Config extends Component<ConfigProps, ConfigState> {
  constructor(props: ConfigProps) {
    super(props);
    this.state = { parameters: { defaultValue: "" } };

    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    props.sdk.app.onConfigure(() => this.onConfigure());
  }

  async componentDidMount() {
    // Get current parameters of the app.
    // If the app is not installed yet, `parameters` will be `null`.
    const parameters: AppInstallationParameters | null = await this.props.sdk.app.getParameters();

    this.setState(parameters ? { parameters } : this.state, () => {
      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      this.props.sdk.app.setReady();
    });
  }

  render() {
    return (
      <Workbench className={css({ margin: "80px" })}>
        <Form>
          <Heading>App Config</Heading>
          <TextField
            name="config"
            id="config"
            labelText="Set a default value to fill in your field editor"
            value={this.state.parameters.defaultValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              this.setState({ parameters: { defaultValue: e.target.value } })
            }
          />
        </Form>
      </Workbench>
    );
  }

  async onConfigure() {
    const { space, ids } = this.props.sdk;
    const editorInterfaces = await space.getEditorInterfaces();

    const appId = ids.app;

    const appIncludedInEditors = (appId: any, editorInterface: any) => {
      if (editorInterface.editor) {
        return appId === editorInterface.editor.widgetId;
      } else if (editorInterface.editors) {
        return editorInterface.editors.some(({ widgetId }: any) => widgetId === appId);
      }
    };

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

    const EditorInterface = contentTypesUsingApp.reduce((edInt, contentTypeId) => {
      return { ...edInt, [contentTypeId]: { editor: true } };
    }, {});

    return {
      parameters: this.state.parameters,
      targetState: {
        EditorInterface,
      },
    };
  }
}
