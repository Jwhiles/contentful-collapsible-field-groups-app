import * as React from "react";
import { TextLink, Modal } from "@contentful/forma-36-react-components";
import { EditorExtensionSDK } from "contentful-ui-extensions-sdk";
import "@contentful/forma-36-react-components/dist/styles.css";
import "@contentful/forma-36-fcss/dist/styles.css";
import "./index.css";
import { FieldGroupsEditor } from "./FieldGroupsEditor";
import { CollapsibleFieldGroup } from "./CollapsibleFieldGroup";
import { findUnassignedFields, AppContext, SDKContext } from "./shared";
import { useAppState } from "./state";
import { ActionTypes, FieldType } from "./types";
import { Field } from "./Field";
import styles from "./styles";

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
    props.sdk.contentType.sys.updatedAt,
    {}
  );

  const unassignedFields = findUnassignedFields(state);

  return (
    <SDKContext.Provider value={props.sdk}>
      <AppContext.Provider value={{ state, dispatch }}>
        <div className={styles.widthContainer}></div>

        <div className={styles.fieldGroupsContainer}>
          {state.fieldGroups.map((fieldGroup) => (
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
                <Field
                  key={k.id}
                  field={fields[k.id]}
                  locales={props.sdk.locales}
                />
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
