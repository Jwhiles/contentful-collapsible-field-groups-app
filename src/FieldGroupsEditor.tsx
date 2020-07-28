import * as React from "react";
import {
  Modal,
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  TextLink,
  HelpText,
  TextField,
  FormLabel,
  FieldGroup,
  Card,
  Paragraph,
  IconButton,
  CardDragHandle,
} from "@contentful/forma-36-react-components";
import { findUnassignedFields, AppContext } from "./shared";
import { FieldType, FieldGroupType } from "./types";
import { ActionTypes } from "./types";
import styles from "./styles";
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
} from "react-sortable-hoc";

interface FieldGroupsEditorProps {
  contentType: any;
  fieldGroups: FieldGroupType[];
  addGroup: () => void;
  onClose: () => void;
}

const DragHandle = SortableHandle(() => (
  <CardDragHandle className={styles.handle}>Reorder item</CardDragHandle>
));

const SortableFieldItem = SortableElement(
  ({
    field,
    groupId,
    contentType,
  }: {
    field: FieldType;
    groupId: string;
    contentType: any;
  }) => {
    const { dispatch } = React.useContext(AppContext);
    const fieldDetails = contentType.fields.find(
      ({ id }: any) => id === field.id
    );

    return (
      <Card className={styles.card}>
        <div className={styles.cardInfo}>
          <DragHandle />
          <Paragraph className={styles.fieldName}>{field.name}</Paragraph>
          {fieldDetails ? <Paragraph>{fieldDetails.type}</Paragraph> : null}
        </div>
        <IconButton
          label="Remove field"
          buttonType="negative"
          iconProps={{ icon: "Close" }}
          onClick={() =>
            dispatch({
              type: ActionTypes.REMOVE_FIELD_FROM_GROUP,
              groupId,
              fieldKey: field.id,
            })
          }
        />
      </Card>
    );
  }
);

const SortableFieldList = SortableContainer(
  ({
    items,
    groupId,
    contentType,
  }: {
    items: FieldType[];
    groupId: string;
    contentType: any;
  }) => (
    <ul className={styles.listContainer}>
      {items.map((field: FieldType, index: number) => (
        <SortableFieldItem
          contentType={contentType}
          groupId={groupId}
          key={`item-${field.id}`}
          index={index}
          field={field}
        />
      ))}
    </ul>
  )
);

export class FieldGroupsEditor extends React.Component<FieldGroupsEditorProps> {
  render() {
    const { fieldGroups, contentType } = this.props;

    return (
      <React.Fragment>
        <div className={styles.controls}>
          <HelpText>
            Group fields to seperate concerns in the entry editor
          </HelpText>
          <div>
            <Button onClick={this.props.addGroup}>Add Group</Button>
            <Button
              className={styles.saveButton}
              buttonType="positive"
              onClick={this.props.onClose}
            >
              Save
            </Button>
          </div>
        </div>
        <Modal.Content>
          {fieldGroups.map(({ name, fields, id }, index) => (
            <FieldGroupEditor
              contentType={contentType}
              first={index === 0}
              last={index === fieldGroups.length - 1}
              key={id}
              groupId={id}
              name={name}
              fields={fields}
            />
          ))}
        </Modal.Content>
      </React.Fragment>
    );
  }
}

interface FieldGroupProps {
  contentType: any;
  first: boolean;
  last: boolean;
  name: string;
  groupId: string;
  fields: FieldType[];
}

const FieldGroupEditor: React.FC<FieldGroupProps> = ({
  contentType,
  first,
  last,
  name,
  fields,
  groupId,
}: FieldGroupProps) => {
  const { state, dispatch } = React.useContext(AppContext);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const updateName = (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({
      type: ActionTypes.RENAME_FIELD_GROUP,
      groupId,
      name: e.currentTarget.value,
    });

  const unassignedFields = findUnassignedFields(state);
  const closeDropdown = () => setDropdownOpen(false);
  const openDropdown = () => {
    if (unassignedFields.length > 0) {
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  };

  const onSortEnd = ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    dispatch({
      type: ActionTypes.MOVE_FIELD_IN_GROUP,
      groupId,
      oldIndex,
      newIndex,
    });
  };

  return (
    <div className={styles.editor}>
      <TextField
        id={`${groupId}-name-input`}
        name={`${groupId}-name-input`}
        labelText="Name"
        onChange={updateName}
        value={name}
      />
      <FieldGroup>
        <FormLabel htmlFor="" className={styles.formLabel}>
          Fields
        </FormLabel>
        <Dropdown
          isOpen={dropdownOpen}
          onClose={closeDropdown}
          toggleElement={
            <Button
              size="small"
              buttonType="muted"
              onClick={openDropdown}
              indicateDropdown
            >
              Select a field to add
            </Button>
          }
        >
          <DropdownList>
            {unassignedFields.map(({ id, name }: FieldType) => (
              <DropdownListItem
                onClick={() => {
                  dispatch({
                    type: ActionTypes.ADD_FIELD_TO_GROUP,
                    groupId,
                    fieldKey: id,
                    fieldName: name,
                  });
                  closeDropdown();
                }}
                key={id}
              >
                {name}
              </DropdownListItem>
            ))}
          </DropdownList>
        </Dropdown>
      </FieldGroup>
      <SortableFieldList
        contentType={contentType}
        distance={
          1 /* this hack is to allow buttons in the drag containers to work*/
        }
        onSortEnd={onSortEnd}
        items={fields}
        groupId={groupId}
      />
      <div>
        <TextLink
          className={styles.fieldGroupConfigurationTextLink}
          linkType="negative"
          icon="Close"
          onClick={() =>
            dispatch({ type: ActionTypes.DELETE_FIELD_GROUP, groupId })
          }
        >
          Remove
        </TextLink>
        {!last ? (
          <TextLink
            className={styles.fieldGroupConfigurationTextLink}
            icon="ChevronDown"
            onClick={() =>
              dispatch({ type: ActionTypes.MOVE_FIELD_GROUP_DOWN, groupId })
            }
          >
            Move down
          </TextLink>
        ) : null}
        {!first ? (
          <TextLink
            className={styles.fieldGroupConfigurationTextLink}
            icon="ChevronUp"
            onClick={() =>
              dispatch({ type: ActionTypes.MOVE_FIELD_GROUP_UP, groupId })
            }
          >
            Move up
          </TextLink>
        ) : null}
      </div>
    </div>
  );
};
