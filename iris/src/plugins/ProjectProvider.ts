import { promises as fs2 } from "fs";
import fs from "fs";
import path from "path";

import fs3 from "fs-extra";
import lockfile from "proper-lockfile";

class ProjectProvider {
  async getProjects() {
    return [];
  }

  async getProject(projectID: string | undefined) {
    const project = {
      id: path.basename(process.cwd()),
      name: path.basename(process.cwd()),
      created: new Date(),
      annotations: {
        version: "v2",
        labels: [],
        annotations: {},
        images: [],
      },
    } as any;

    try {
      const annotationsString = await fs2.readFile(
        path.join(process.cwd(), "_annotations.json"),
        "utf-8"
      );
      project.annotations = JSON.parse(annotationsString);
    } catch {}

    let files;
    if (projectID) {
      files = await fs2.readdir(path.join(process.cwd(), projectID));
    } else {
      files = await fs2.readdir(path.join(process.cwd()));
    }

    project.annotations.images = files
      .filter(
        (f) =>
          f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".jpeg")
      )
      .map((i) => ({ id: i, date: "" }));

    return project;
  }

  async persist(projectID: string | undefined, annotations: any) {
    let output;
    if (projectID) {
      output = path.join(process.cwd(), projectID, "_annotations.json");
    } else {
      output = path.join(process.cwd(), "_annotations.json");
    }

    // TODO: This probably isn't safe
    await fs2.writeFile(output, JSON.stringify(annotations), "utf-8");
  }

  async getImage(projectID: string | undefined, imageID: string) {
    let output;
    if (projectID) {
      output = path.join(process.cwd(), projectID, imageID);
    } else {
      output = path.join(process.cwd(), imageID);
    }

    const isLocked = await lockfile.check(output);
    if (!isLocked) {
      const stream = fs.createReadStream(output);
      return stream;
    }
    throw new Error("file is locked");
  }

  async saveImage(filename: string, stream: NodeJS.ReadableStream) {
    const output = path.join(process.cwd(), filename);
    await fs3.ensureFile(output);
    const release = await lockfile.lock(output);
    const writeStream = fs.createWriteStream(output);
    stream.pipe(writeStream);
    return new Promise((resolve) => {
      stream.on("close", async () => {
        await release();
        resolve();
      });
    });
  }
}

export default ProjectProvider;
