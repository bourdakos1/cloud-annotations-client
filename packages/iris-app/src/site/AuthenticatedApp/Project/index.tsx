import React from "react";

import { useProject } from "@iris/store/dist/project";
import { useParams } from "react-router-dom";

import Header from "./Header";
import Layout from "./Layout";
import Main from "./Main";

function ProjectsView() {
  return <Layout header={<Header />} main={<Main />} />;
}

function ProjectController() {
  const { id } = useParams<{ id: string }>();
  const { status } = useProject(id);

  switch (status) {
    case "idle":
    case "pending":
      return <div>LOADING...</div>;
    case "success":
      return <ProjectsView />;
    default:
      return <div>ERROR</div>;
  }
}

export default ProjectController;
