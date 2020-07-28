import React, { Component } from "react";
import { AppExtensionSDK } from "contentful-ui-extensions-sdk";
import {
  Heading,
  Form,
  Workbench,
  Select,
  Option,
  TextLink,
  Modal,
} from "@contentful/forma-36-react-components";
import { useAppState } from "./state";
import { css } from "emotion";
import { FieldGroupsEditor } from "./FieldGroupsEditor";
import { ActionTypes, FieldType } from "./types";
import { findUnassignedFields, AppContext, SDKContext } from "./shared";
import styles from "./styles";

// export interface AppInstallationParameters {
//
// }

interface ConfigProps {
  sdk: AppExtensionSDK;
}

interface ConfigState {
  parameters: any;
  contentTypes: any[];
  selectedContentType: string;
}

export default class Config extends Component<ConfigProps, ConfigState> {
  constructor(props: ConfigProps) {
    super(props);
    this.state = {
      contentTypes: [],
      selectedContentType: "",
      parameters: {},
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
    const parameters: any | null = await this.props.sdk.app.getParameters();
    const contentTypes = await this.getContentTypesUsingEditor();

    console.log(this.props.sdk.parameters);

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
          {this.state.contentTypes.map((ct) => (
            <div key={ct.id}>
              <Heading>{ct.name}</Heading>

              <Whatever
                update={(result: any) => {
                  const parameters = { ...this.state.parameters, ...result };
                  this.setState({ parameters });
                }}
                contentType={ct}
                parameters={this.state.parameters}
              />
            </div>
          ))}
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
        return editorInterface.editors.some(
          ({ widgetId }: any) => widgetId === appId
        );
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

const Whatever = ({ contentType, update, parameters }: any) => {
  const contentId = contentType.sys.id;
  const spaceId = contentType.sys.space?.sys.id;
  const environmentId = contentType.sys.environment?.sys.id;

  // move this up a bit..
  const [state, dispatch] = useAppState(
    contentType.fields,
    `${contentId}-${spaceId}-${environmentId}`,
    contentType.sys.updatedAt,
    parameters
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const closeDialog = () => {
    update({ [`${contentId}-${spaceId}-${environmentId}`]: state });
    setDialogOpen(false);
  };
  const openDialog = () => setDialogOpen(true);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <TextLink
        icon="Edit"
        className={styles.editGroupsButton}
        onClick={openDialog}
      >
        Edit field groups
      </TextLink>
      <Modal size="large" isShown={dialogOpen} onClose={closeDialog}>
        {() => (
          <React.Fragment>
            <Modal.Header onClose={closeDialog} title="Edit field groups" />
            <FieldGroupsEditor
              addGroup={() =>
                dispatch({ type: ActionTypes.CREATE_FIELD_GROUP })
              }
              fieldGroups={state.fieldGroups}
              onClose={closeDialog}
              contentType={contentType}
            />
          </React.Fragment>
        )}
      </Modal>
    </AppContext.Provider>
  );
};
