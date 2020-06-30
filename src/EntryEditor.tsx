import * as React from "react";
import { render } from "react-dom";
import { TextLink, Modal } from "@contentful/forma-36-react-components";
import {
  init,
  locations,
  EditorExtensionSDK,
  DialogExtensionSDK,
} from "contentful-ui-extensions-sdk";
import "@contentful/forma-36-react-components/dist/styles.css";
import "@contentful/forma-36-fcss/dist/styles.css";
import "./index.css";
import { FieldGroupsEditor } from "./FieldGroupsEditor";
import { CollapsibleFieldGroup } from "./CollapsibleFieldGroup";
import { findUnassignedFields, AppContext, SDKContext } from "./shared";
import { useAppState } from "./state";
import { ActionTypes, FieldType } from "./types";
import { Field } from "./Field";
import { renderMarkdownDialog } from "@contentful/field-editor-markdown";
import { renderRichTextDialog } from "@contentful/field-editor-rich-text";
import styles from "./styles";
import { createClient } from "contentful-management";

interface AppProps {
  sdk: EditorExtensionSDK;
}

const storageId = (sdk: EditorExtensionSDK): string => {
  const contentId = sdk.contentType.sys.id;
  const spaceId = sdk.contentType.sys.space?.sys.id;
  const environmentId = sdk.contentType.sys.environment?.sys.id;

  return `${contentId}-${spaceId}-${environmentId}`;
};

const Entry: React.FunctionComponent<AppProps> = (props: AppProps) => {
  const { fields } = props.sdk.entry;

  const [state, dispatch] = useAppState(
    props.sdk.contentType.fields,
    storageId(props.sdk),
    props.sdk.contentType.sys.updatedAt
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const closeDialog = () => setDialogOpen(false);
  const openDialog = () => setDialogOpen(true);

  const unassignedFields = findUnassignedFields(state);

  return (
    <SDKContext.Provider value={props.sdk}>
      <AppContext.Provider value={{ state, dispatch }}>
        <div className={styles.widthContainer}>
          <TextLink icon="Edit" className={styles.editGroupsButton} onClick={openDialog}>
            Edit field groups
          </TextLink>
        </div>
        <Modal size="large" isShown={dialogOpen} onClose={closeDialog}>
          {() => (
            <React.Fragment>
              <Modal.Header onClose={closeDialog} title="Edit field groups" />
              <FieldGroupsEditor
                addGroup={() => dispatch({ type: ActionTypes.CREATE_FIELD_GROUP })}
                fieldGroups={state.fieldGroups}
                onClose={closeDialog}
              />
            </React.Fragment>
          )}
        </Modal>

        <div className={styles.fieldGroupsContainer}>
          {state.fieldGroups.map(fieldGroup => (
            <CollapsibleFieldGroup
              key={fieldGroup.id}
              locales={props.sdk.locales}
              fieldGroup={fieldGroup}
              fields={fields}
            />
          ))}

          <div className={styles.widthContainer}>
            <div>
              {unassignedFields.map((k: FieldType) => (
                <Field key={k.id} field={fields[k.id]} locales={props.sdk.locales} />
              ))}
            </div>
          </div>
        </div>
      </AppContext.Provider>
    </SDKContext.Provider>
  );
};
// const Entry = ({ sdk }: { sdk: EditorExtensionSDK}) => {
//   const installation = sdk.parameters.installation as AppInstallationParameters;

//   return (
//     <div>
//       <Button onClick={() => sdk.field.setValue(installation.defaultValue)}>
//         Click to set to default value of {installation.defaultValue}
//       </Button>
//       <SingleLineEditor locales={sdk.locales} field={sdk.field} />
//     </div>
//   );
// };

export default Entry;
