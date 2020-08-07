import React, { Component } from "react";
import { AppExtensionSDK } from "contentful-ui-extensions-sdk";
import {
  Heading,
  Form,
  Workbench,
  TextLink,
  Modal,
  Subheading,
} from "@contentful/forma-36-react-components";
import { useAppState } from "./state";
import { css } from "emotion";
import { FieldGroupsEditor } from "./FieldGroupsEditor";
import { ActionTypes } from "./types";
import { AppContext } from "./shared";
import styles from "./styles";

interface ConfigProps {
  sdk: AppExtensionSDK;
}

interface ConfigState {
  installed: boolean;
  parameters: { [key: string]: any };
  contentTypes: any[];
  otherContentTypes: any[];
  selectedContentType: string;
}

export default class Config extends Component<ConfigProps, ConfigState> {
  constructor(props: ConfigProps) {
    super(props);
    this.state = {
      installed: false,
      contentTypes: [],
      otherContentTypes: [],
      selectedContentType: "",
      parameters: {},
    };

    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    props.sdk.app.onConfigure(() => this.onConfigure());
    props.sdk.app.onConfigurationCompleted(() => this.setup());
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
      (
        acc: { contentTypes: string[]; others: string[] },
        editorInterface: any
      ) => {
        if (appIncludedInEditors(appId, editorInterface)) {
          const contentTypeId = editorInterface.sys?.contentType?.sys?.id;
          acc.contentTypes.push(contentTypeId);
        } else {
          const contentTypeId = editorInterface.sys?.contentType?.sys?.id;
          acc.others.push(contentTypeId);
        }
        return acc;
      },
      { contentTypes: [], others: [] }
    );

    const contentTypes = await Promise.all(
      entryIds.contentTypes.map((id: string) => space.getContentType(id))
    );

    const otherContentTypes = await Promise.all(
      entryIds.others.map((id: string) => space.getContentType(id))
    );

    return { contentTypes, otherContentTypes };
  }

  async setup() {
    const installed = await this.props.sdk.app.isInstalled();

    if (!installed) {
      this.setState(
        {
          installed: false,
        },
        () => {
          this.props.sdk.app.setReady();
        }
      );
    }

    // Get current parameters of the app.
    // If the app is not installed yet, `parameters` will be `null`.
    const parameters: any | null = await this.props.sdk.app.getParameters();
    const {
      contentTypes,
      otherContentTypes,
    } = await this.getContentTypesUsingEditor();

    this.setState(
      parameters
        ? {
            installed: true,
            parameters,
            contentTypes,
            otherContentTypes,
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

  async componentDidMount() {
    return this.setup();
  }

  render() {
    if (!this.state.installed) {
      return (
        <Workbench className={css({ margin: "80px" })}>
          <Heading>Install the app to configure</Heading>
        </Workbench>
      );
    }

    return (
      <Workbench className={css({ margin: "80px" })}>
        <Form>
          <Heading>Field Group Set Up Config</Heading>
          <Subheading>Content Types with collapsible editor</Subheading>
          {this.state.contentTypes.map((ct, idx) => (
            <div key={ct.id}>
              <Heading>{ct.name}</Heading>
              <AssignedContentType
                update={(result: any) => {
                  const parameters = { ...this.state.parameters, ...result };
                  this.setState({ parameters });
                }}
                contentType={ct}
                parameters={this.state.parameters}
                assignEditor={() => {
                  const { contentTypes, otherContentTypes } = this.state;
                  this.setState({
                    otherContentTypes: otherContentTypes.concat([ct]),
                    contentTypes: contentTypes
                      .slice(0, idx)
                      .concat(contentTypes.slice(idx + 1)),
                  });
                }}
              />
            </div>
          ))}

          {this.state.otherContentTypes.map((ct, idx) => (
            <div key={ct.id}>
              <Heading>{ct.name}</Heading>
              <UnassignedContentType
                assignEditor={() => {
                  const { contentTypes, otherContentTypes } = this.state;
                  this.setState({
                    otherContentTypes: otherContentTypes
                      .slice(0, idx)
                      .concat(otherContentTypes.slice(idx + 1)),
                    contentTypes: contentTypes.concat([ct]),
                  });
                }}
              />
            </div>
          ))}
        </Form>
      </Workbench>
    );
  }

  async onConfigure() {
    const blah = this.state.contentTypes.map((ct) => ct.sys.id);

    const EditorInterface = blah.reduce((edInt, contentTypeId) => {
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

const UnassignedContentType = ({
  assignEditor,
}: {
  assignEditor: () => void;
}) => {
  return (
    <div>
      <TextLink
        icon="ThumbUp"
        className={styles.editGroupsButton}
        onClick={assignEditor}
      >
        Use custom editor with this content type
      </TextLink>
    </div>
  );
};

const AssignedContentType = ({
  contentType,
  update,
  parameters,
  assignEditor,
}: {
  contentType: any;
  update: any;
  parameters: { [key: string]: any };
  assignEditor: () => void;
}) => {
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
      <TextLink
        icon="Delete"
        className={styles.editGroupsButton}
        onClick={assignEditor}
      >
        Remove custom editor
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
