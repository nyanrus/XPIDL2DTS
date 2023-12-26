import * as fs from "fs/promises";
import * as fg from "fast-glob";
import { preprocess } from "./src/preprocess.js";
import { isEmpty } from "./src/post-processing/clean_empty_dts.js";
import { processLine } from "./src/funcs.js";
import { getExportFromDir } from "./src/post-processing/export2metadata.js";
import { getUnresolvedTypes, resetUnresolvedTypes } from "./src/idltype.js";
import { parseIncludeFromDir } from "./src/post-processing/include2metadata.js";
import { processImport2TSFromObjMetadata } from "./src/post-processing/metadata2import_dts.js";
import { writeComponents } from "./src/post-processing/gen_components.js";
import {
  getConstants,
  resetConstants,
} from "./src/post-processing/constants2list.js";
import { addConstantsWithMetadata } from "./src/post-processing/constants2metadata.js";
import { AUTO_GENERATED_COMMENT } from "./src/defines.js";

function process(src: string): string {
  resetUnresolvedTypes();
  resetConstants();
  let buf = "";
  let index = 0;
  let obj_export_ident = { type: [], interface: [] };
  while (index < src.length) {
    //* MULTICOMMENT
    if (src.startsWith("/*", index)) {
      const idx_end_multicomment = src.indexOf("*/\n", index);
      if (idx_end_multicomment === -1) {
        buf += src.slice(index);
        break;
      }
      buf += src.slice(index, idx_end_multicomment + 3);
      index = idx_end_multicomment + 3;
    }
    //* SINGLECOMMENT
    else if (src.startsWith("//", index)) {
      const idx_next_newline = src.indexOf("\n", index);
      if (idx_next_newline === -1) {
        buf += src.slice(index);
        break;
      }
      buf += src.slice(index, idx_next_newline + 1);
      index = idx_next_newline + 1;
    }
    //* NORMAL
    else {
      //console.log("NORMAL");
      const idx_next_newline = src.indexOf("\n", index);
      if (idx_next_newline === -1) {
        buf += processLine(src.slice(index), obj_export_ident);
        break;
      }
      buf += processLine(
        src.slice(index, idx_next_newline + 1),
        obj_export_ident,
      );
      index = idx_next_newline + 1;
    }
  }

  buf += `\n///EXPORT ${JSON.stringify(obj_export_ident)}`;
  buf += `\n///UNRESOLVED_TYPES ${JSON.stringify(getUnresolvedTypes())}`;
  buf += `\n///CONSTANTS ${JSON.stringify(getConstants())}`;

  return buf;
}

/**
 * it named because not reads moz.build files
 * but this function is used as not test
 * because this is enough to use
 * @param root firefox root
 * @param dirs dirs to read
 */
async function processAll4Test(root: string, dirs: string[]) {
  console.log("processing");

  await fs.rmdir("./dist", { recursive: true });
  const files = await fg.default(
    dirs.map((v) => {
      return root + "/" + v + "/" + "**/*.idl";
    }),
    { dot: true },
  );

  for (const _file of files) {
    console.log(_file);
    if (_file.includes("cld.idl")) {
      //this is not XPIDL files
      continue;
    }
    if (!_file.includes("node_modules") && !_file.includes("other-licenses")) {
      //console.log(_file);
      //console.log(_file.name);

      const fileName = _file.replace("\\", "/").split("/").slice(-1)[0];
      const realPath =
        _file.replace("\\", "/").split("/").slice(0, -1).join("/") + "/";
      const path = realPath.replace(root + "/", "");
      console.log(_file);
      const src = (await fs.readFile(_file)).toString();
      const preprocessed = preprocess(src);
      await fs.mkdir("dist/pp/" + path.replace("../", ""), {
        recursive: true,
      });

      fs.writeFile(
        "dist/pp/" + path + "/" + fileName.replace(".idl", ".d.ts"),
        AUTO_GENERATED_COMMENT + "\n" + preprocessed,
      );
      const processed = process(preprocessed);

      //console.log(path);
      if (!isEmpty(processed)) {
        await fs.mkdir("dist/p/" + path.replace("../", ""), {
          recursive: true,
        });
        await fs.writeFile(
          "dist/p/" + path + "/" + fileName.replace(".idl", ".d.ts"),
          AUTO_GENERATED_COMMENT + "\n" + processed,
        );
      }
    }
  }
  let objMetadata = await getExportFromDir("dist/p");

  objMetadata = await parseIncludeFromDir("dist/p", objMetadata);

  objMetadata = await addConstantsWithMetadata(objMetadata);

  await fs.writeFile("./metadata.json", JSON.stringify(objMetadata));
  await processImport2TSFromObjMetadata(objMetadata);

  await writeComponents("./dist/p/index.d.ts", objMetadata);
}

function main() {
  {
    processAll4Test("../nyanrus_Floorp", [
      "xpcom",
      "netwerk",
      "dom/interfaces/security",
      "dom/base",
      "dom/interfaces/base",
      "uriloader",
      "services",
      "widget",
      "image",
      "layout",
      "js",
      "toolkit",
      "caps",
    ]);
  }
}

main();
