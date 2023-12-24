import fg from "fast-glob";
import * as fs from "fs/promises";
import { Metadata, ObjMetadata } from "../defines.js";
import { getConstants } from "./constants2list.js";

export function getExportJSON(src: string): Metadata | undefined {
  // console.log(
  //   "export:" +
  //     src
  //       .split("\n")
  //       .filter((v) => {
  //         return v.includes("///EXPORT");
  //       })
  //       .join("")
  //       .replace("///EXPORT", "")
  //       .trim(),
  // );
  if (
    src
      .split("\n")
      .filter((v) => {
        return v.includes("///EXPORT");
      })
      .join("")
      .replace("///EXPORT", "")
      .trim() !== ""
  ) {
    return JSON.parse(
      src
        .split("\n")
        .filter((v) => {
          return v.includes("///EXPORT");
        })
        .join("")
        .replace("///EXPORT", "")
        .trim(),
    );
  }
}

export async function getExportFromDir(dir: string): Promise<ObjMetadata> {
  const obj: ObjMetadata = {};
  const files = await fg([dir + "/**/*.d.ts"], { dot: true });
  for (const file of files) {
    const fileName = file.replace("\\", "/").split("/").pop();
    const src = (await fs.readFile(file)).toString();
    const json = getExportJSON(src);
    if (json && fileName) {
      json.filePath = file;
      json.imports = [];

      Object.assign(obj, { [fileName]: json });
    }
  }
  return obj;
}
