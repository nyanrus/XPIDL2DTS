import * as fs from "fs/promises";
import fg from "fast-glob";
import { ObjMetadata } from "./defines.js";

/**
 * parse Include to list like
 * `///INCLUDE #include "nsISupports.idl"`
 * to
 * `["nsrootidl.d.ts","nsISupports.d.ts"]`
 */

/**
 * parse include to import all file recursive
 * @param src
 * @param exports export object
 * @returns import list
 */
export async function parseInclude(
  src: string,
  objMetadata: ObjMetadata,
): Promise<string[]> {
  let ret: string[] = [];
  const lines_include = src
    .split("\n")
    .filter((v) => {
      return v.includes("///INCLUDE");
    })
    .map((v) => {
      return v.trim();
    });

  console.log(`lines_include: ${JSON.stringify(lines_include)}`);

  //console.log(src);
  //include format is
  //`///INCLUDE #include "[FILENAME]"`
  for (const line of lines_include) {
    const fileName = line.split('"')[1].replace(".idl", ".d.ts");
    //console.log(fileName);
    //console.log(JSON.stringify(exports[fileName]));
    //console.log("exports:" + exports[fileName]["filePath"]);
    //const filePath =
    ret.push(
      ...(await parseIncludeFromFile(
        objMetadata[fileName].filePath,
        objMetadata,
      )),
    );
    ret.push(fileName);
  }
  return [...new Set(ret)];
}

export async function parseIncludeFromDir(
  dir: string,
  objMetadata: ObjMetadata,
): Promise<ObjMetadata> {
  //const exports = JSON.parse((await fs.readFile("exports.json")).toString());
  //console.log("exports" + Object.entries(exports));
  const files = await fg([dir + "/" + "**/*.d.ts"], { dot: true });
  for (const file of files) {
    const fileName = file.replace("\\", "/").split("/").pop();
    if (!fileName) {
      continue;
    }
    console.log(fileName);
    const imports = await parseIncludeFromFile(file, objMetadata);
    if (imports.includes("nsISupports.d.ts")) {
      console.log(imports);
    }
    console.log(
      objMetadata[file.replace("\\", "/").split("/").slice(-1).join("")],
    );
    objMetadata[file.replace("\\", "/").split("/").slice(-1).join("")].imports =
      [...new Set(imports)];
    // const src = (await fs.readFile(file)).toString();
    // const idx_include = src.indexOf("///INCLUDE");
    // if (idx_include !== -1) {
    //   let _src = src.replaceAll(/\/\/\/INCLUDE.*\n/g, "");
    //   //console.log(JSON.stringify(imports));
    //   const ret =
    //     _src.slice(0, idx_include) +
    //     "\n" +
    //     imports
    //       .map((v) => {
    //         return `///IMPORT ${v}`;
    //       })
    //       .join("\n") +
    //     "\n" +
    //     _src.slice(idx_include);
    //   fs.writeFile(file, ret);
    // }
  }
  return objMetadata;
}

/**
 * func for fs
 * @param file
 * @param exports
 * @returns import list
 */
export async function parseIncludeFromFile(
  file: string,
  objMetadata: ObjMetadata,
): Promise<string[]> {
  const src = (await fs.readFile(file)).toString();
  return parseInclude(src, objMetadata);
}
