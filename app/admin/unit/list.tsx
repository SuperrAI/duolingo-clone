import {
  Datagrid,
  List,
  NumberField,
  ReferenceField,
  TextField,
} from "react-admin";

export const ChapterList = () => {
  return (
    <List>
      <Datagrid rowClick="edit">
        <NumberField source="id" />
        <TextField source="title" />
        <TextField source="description" />
        <ReferenceField source="subjectId" reference="subjects" />
        <TextField source="order" />
      </Datagrid>
    </List>
  );
};
