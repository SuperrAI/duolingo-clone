import {
  Create,
  NumberInput,
  ReferenceInput,
  SimpleForm,
  TextInput,
  required,
} from "react-admin";

export const TopicCreate = () => {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="title" validate={[required()]} label="Title" />
        <ReferenceInput source="chapterId" reference="chapters" />
        <NumberInput source="order" validate={required()} label="Order" />
      </SimpleForm>
    </Create>
  );
};
