import path from "path";
import { ObjMetadata } from "../defines.js";
import * as fs from "fs/promises";

export async function writeComponents(
  filePath: string,
  objMetadata: ObjMetadata,
) {
  let imports = "";
  let exports = "";
  let type_exports = "";

  let local_classes = "";

  for (const [_, meta] of Object.entries(objMetadata)) {
    let inner = "";
    let import_interface = "import type {";
    for (let _interface of meta.interface) {
      //_interface = _interface.replace(";", "");
      import_interface += `${_interface} as _${_interface},`;

      if (_interface in meta.constants)
        for (const [name_constant, value_constant] of Object.entries(
          meta.constants[_interface],
        )) {
          if (value_constant.includes("|")) {
            function process_bit_or(value_constant: string): string {
              console.log(value_constant);
              return eval(
                value_constant
                  .replaceAll(" ", "")
                  .split("|")
                  .map((v) => {
                    const _tmp = meta.constants[_interface][v];
                    if (_tmp.includes("|")) {
                      return process_bit_or(_tmp);
                    } else {
                      return _tmp;
                    }
                  })
                  .join("|"),
              );
            }
            inner += `readonly ${name_constant} = ${process_bit_or(
              value_constant,
            )};\n`;
          } else {
            //TODO 危険かも
            inner += `readonly ${name_constant} = ${eval(value_constant)};\n`;
          }
        }

      local_classes += `//@ts-ignore error because ts(2420)\nabstract class ${_interface} {${inner}};\n`;

      //exports += `//@ts-ignore error because ts(2420)\nabstract class ${_interface} implements _${_interface} {${inner}}\n`;
      exports += `${_interface} : lfoLocal.${_interface};\n`;
      type_exports += `${_interface} : _${_interface};\n`;
    }
    import_interface += `} from "./${path
      .relative(filePath.split("/").slice(0, -1).join("/"), meta.filePath)
      .replaceAll(/\\/g, "/")}"\n`;
    imports += import_interface;
  }
  let src = `
${imports}

export namespace lfoLocal {
${local_classes}
}


export interface Components_Interfaces extends _nsIXPCComponents_Interfaces {
  ${type_exports}
}

export interface lfoCi {
  ${exports}
}

declare var Components_Utils: _nsIXPCComponents_Utils;

type lfoCi2Type<
  T,
  I extends Components_Interfaces,
  L extends lfoCi,
  K extends keyof L,
> = T extends L[K] ? I[K] : unknown;

interface _lfoClasses {
  createInstance: <
    K extends keyof Components_Interfaces,
    V extends lfoCi[K],
    R extends lfoCi2Type<V>,
  >(
    aClass: V, ///in
  ) => R;

  getService: <
    K extends keyof Components_Interfaces,
    V extends lfoCi[K],
    R extends lfoCi2Type<V>,
  >(
    aClass: V, ///in
  ) => R;
}

interface Components extends _nsIXPCComponents {
  readonly interfaces: lfoCi;
  readonly utils: typeof Components_Utils;
  readonly classes: { [x: string]: _lfoClasses };
}

declare var Components: Components;


  `;
  fs.writeFile(filePath, src.trim());
}
