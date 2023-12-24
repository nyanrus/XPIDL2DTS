import { ObjMetadata } from "../defines.js";
import * as fs from "fs/promises";

export async function addConstantsWithMetadata(
  objMetadata: ObjMetadata,
): Promise<ObjMetadata> {
  for (const [idx, meta] of Object.entries(objMetadata)) {
    const src = (await fs.readFile(meta.filePath)).toString();
    const constants = src
      .split("\n")
      .filter((v) => {
        return v.includes("///CONSTANTS");
      })
      .map((v) => {
        return JSON.parse(v.replace("///CONSTANTS ", ""));
      })[0];
    if (constants.length !== 0) {
      objMetadata[idx].constants = constants;
    }
  }
  return objMetadata;
}
