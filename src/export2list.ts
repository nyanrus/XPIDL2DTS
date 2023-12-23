import fg from "fast-glob";
import * as fs from "fs/promises";

export function getExportJSON(src: string): any {
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

export async function getExportFromDir(dir: string): Promise<any> {
  const obj = {};
  const files = await fg([dir + "/" + "**/*.d.ts"], { dot: true });
  for (const file of files) {
    const fileName = file.replace("\\", "/").split("/").pop();
    const src = (await fs.readFile(file)).toString();
    const json = getExportJSON(src);
    if (json) {
      json.filePath = file;
      //@ts-ignore
      Object.assign(obj, { [fileName]: json });
    }
  }
  return obj;
}
