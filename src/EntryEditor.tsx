import * as React from "react";
import { EditorExtensionSDK } from "contentful-ui-extensions-sdk";
import "@contentful/forma-36-react-components/dist/styles.css";
import "@contentful/forma-36-fcss/dist/styles.css";
import "./index.css";
import { CollapsibleFieldGroup } from "./CollapsibleFieldGroup";
import { findUnassignedFields, AppContext, SDKContext } from "./shared";
import { useAppState } from "./state";
import { FieldType, Parameters } from "./types";
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
    props.sdk.parameters.installation as Parameters
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

export default Entry;
