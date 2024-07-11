"use client";

import simpleRestProvider from "ra-data-simple-rest";
import { Admin, Resource } from "react-admin";

import { ChallengeCreate } from "./challenge/create";
import { ChallengeEdit } from "./challenge/edit";
import { ChallengeList } from "./challenge/list";
import { ChallengeOptionCreate } from "./challengeOption/create";
import { ChallengeOptionEdit } from "./challengeOption/edit";
import { ChallengeOptionsList } from "./challengeOption/list";
import { SubjectCreate } from "./subject/create";
import { SubjectEdit } from "./subject/edit";
import { SubjectList } from "./subject/list";
import { SkillCreate } from "./skill/create";
import { SkillEdit } from "./skill/edit";
import { SkillList } from "./skill/list";
import { ChapterCreate } from "./chapter/create";
import { ChapterEdit } from "./chapter/edit";
import { ChapterList } from "./chapter/list";

const dataProvider = simpleRestProvider("/api");

const App = () => {
  return (
    <Admin dataProvider={dataProvider}>
      <Resource
        name="subjects"
        recordRepresentation="title"
        list={SubjectList}
        create={SubjectCreate}
        edit={SubjectEdit}
      />

      <Resource
        name="chapters"
        recordRepresentation="title"
        list={ChapterList}
        create={ChapterCreate}
        edit={ChapterEdit}
      />

      <Resource
        name="skills"
        recordRepresentation="title"
        list={SkillList}
        create={SkillCreate}
        edit={SkillEdit}
      />

      <Resource
        name="challenges"
        recordRepresentation="question"
        list={ChallengeList}
        create={ChallengeCreate}
        edit={ChallengeEdit}
      />

      <Resource
        name="challengeOptions"
        recordRepresentation="text"
        list={ChallengeOptionsList}
        create={ChallengeOptionCreate}
        edit={ChallengeOptionEdit}
        options={{
          label: "Challenge Options",
        }}
      />
    </Admin>
  );
};

export default App;
