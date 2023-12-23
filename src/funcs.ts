import { Attribute } from "./defines.js";
import { IDLType2TS, addResolveTypes } from "./idltype.js";

/**
 * in interface parse
 * `[ATTR] [readonly] attribute [TYPE] [NAME];`
 * to `//PROPERTY [ATTR]\n [readonly] name:type,`
 * @param line line of source
 * @param attr Attribute in this line.
 * if attr contains noscript, return just COMMENT
 * @returns processed line
 */
export function processProperty(line: string, attr: Attribute | null): string {
  console.log(`property: ${line}`);
  const tokens = line.split(" ");
  let index = 0;

  let readonly = false;
  let type: string;
  let name: string;
  if (attr?.values.includes("noscript")) {
    return `///NOSCRIPT ${line}`;
  } else if (attr?.values.includes("notxpcom")) {
    return `///NOTXPCOM ${line}`;
  }
  //* [readonly]
  {
    readonly = tokens[index] === "readonly";
    if (readonly) index += 1;
  }
  //* attribute
  {
    if (!(tokens[index] === "attribute")) throw Error("this is not property!");
    index += 1;
  }
  //* [TYPE]
  {
    type = IDLType2TS(tokens.slice(index, -1).join(" "));
  }
  //* [NAME]
  {
    name = tokens.slice(-1)[0].replaceAll(/[;\n]/g, "");
    if (name === "function") name = "_function";
  }
  //`//PROPERTY [ATTR]\n [readonly] name:type,`
  return `${attr ? `//PROPERTY ${attr.toLine()}\n` : ""}${
    readonly ? "readonly " : ""
  }${name}:${type};\n`;
}

/**
 * process Function Arguments like
 * (in int32_t A, inout uint32_t B, [retval] out long long C)
 * @param raw_args
 * @return [args, retval?]
 */
export function processFuncArgs(raw_args: string): [string, string | null] {
  raw_args = raw_args.replaceAll(/\/\*.*\*\//g, ""); //remove inside comment
  let arr_args: string[] = [];
  //* split to tokens
  {
    //console.log("split token");
    let index = 0;
    while (index < raw_args.length) {
      let _buf = "";
      if (raw_args.startsWith("[", index)) {
        const idx_end_square_bracket = raw_args.indexOf("]", index);
        _buf += raw_args.slice(index, idx_end_square_bracket + 1);
        index = idx_end_square_bracket + 1;
        //console.log(`startsWith[ ${_buf}`);
      }
      const idx_comma = raw_args.indexOf(",", index);
      //console.log(`idx_comma : ${idx_comma}`);
      if (idx_comma === -1) {
        arr_args.push(_buf + raw_args.slice(index));
        break;
      }
      _buf += raw_args.slice(index, idx_comma);
      index = idx_comma + 1;
      //console.log(`_buf: ${_buf}`);
      arr_args.push(_buf);
      //* remove whitespace after comma
      while (raw_args[index] === " ") {
        index += 1;
      }
    }

    //console.log(`split end:${arr_args}`);
  }
  let ret_type_retval: string | null = null;
  let ret_args = [];
  for (const elem of arr_args) {
    let _attribute: Attribute | null;
    let _elem: string;
    //* attribute
    {
      //console.log(`elem:${elem}`);
      if (elem.startsWith("[")) {
        [_attribute, _elem] = Attribute.fromLine(elem);
      } else {
        _attribute = null;
        _elem = elem;
      }
    }

    let index = 0;
    const tokens = _elem.split(" ");
    let type: string;
    let name: string;

    let mode;

    //* `in` or `out` or `inout`
    {
      if (
        !(
          tokens[index] === "in" ||
          tokens[index] === "out" ||
          tokens[index] === "inout"
        )
      ) {
        mode = "in?";
      } else {
        mode = tokens[index];
      }
      //throw Error("function args not starts with `in` or `out` or `inout`");
      index += 1;
    }
    //* [TYPE]
    {
      type = IDLType2TS(tokens.slice(index, -1).join(" "));
    }
    //* [NAME]
    {
      name = tokens.slice(-1)[0];
      if (name === "function") name = "_function";
    }

    //* check retval of attribute
    if (_attribute?.values.includes("retval")) {
      ret_type_retval = type;
    } else {
      //console.log(`name: ${name}`);
      ret_args.push(`${name}: ${type},///${tokens[0]}\n`);
    }
  }
  return [ret_args.join(""), ret_type_retval];
}

/**
 * process XPIDL Function to TS Format
 * @param line line to process
 * @param attr attribute of the line
 * @returns [line]
 */
export function processFunction(line: string, attr: Attribute | null): string {
  if (attr?.values.includes("noscript") || attr?.values.includes("notxpcom"))
    return "";
  //console.log("processFunction start");
  //console.log(line);
  const _first = line.slice(0, line.indexOf("("));
  const _second = line.slice(line.indexOf("(") + 1);
  //console.log(`${_first}, ${_second}`);

  const [func_name, ret_type] = (() => {
    const _arr_first = _first.trim().split(" ");
    return [_arr_first.pop(), IDLType2TS(_arr_first.join(" "))];
  })();

  const raw_args = _second.replace(");", "").trim();
  //console.log(raw_args);

  let args: string;
  let args_retval: string | null;
  if (raw_args) {
    [args, args_retval] = processFuncArgs(raw_args);
  } else {
    [args, args_retval] = ["", null];
  }

  return `${
    attr ? `///FUNCTION ${attr.toLine()}\n` : ""
  }${func_name}: (${args}) => ${args_retval ? args_retval : ret_type};\n`;
}
//TODO
function processCENUM(line: string): string {
  const tokens = line.split(" ");
  //0 is cenum keyword
  const name = tokens[1];
  //2 is `:`
  const bytenum = tokens[3];
  const tokens_inner = tokens.slice(4).join("").replaceAll(/[{}]/g, "");

  let inner = "";
  let num = 0;
  for (const t of tokens_inner.split(",")) {
    if (t.replaceAll(/[;]|[\s]/g, "") !== "") {
      console.log(`t: ${t}`);
      if (t.includes("=")) {
        const _tmp = t.split("=");
        const elem_name = _tmp[0];
        const elem_num = _tmp[1];
        num = Number(elem_num);
        inner += `${elem_name}:${num};`;
      } else {
        inner += `${t.replaceAll(/[;\n]/g, "")}:${num};`;
      }
      num += 1;
    }
  }
  return `///CENUM ${bytenum}\n${name}:{${inner}}\n`;
}

let not_scriptable_interface = false;
export function processLine(
  line: string,
  obj_export_ident: { type: string[]; interface: string[] },
): string {
  let attribute: Attribute | null = null;

  let _line = line;

  if (not_scriptable_interface) {
    if (_line.trim().startsWith("};")) {
      not_scriptable_interface = false;
    }
    return "";
  }
  console.log(`_line = ${_line}`);

  //* ATTRIBUTE
  if (_line.startsWith("[")) {
    [attribute, _line] = Attribute.fromLine(_line);
  }

  //* reject native
  //TODO: move to some function
  if (_line.startsWith("native ")) {
    return `///NATIVE ${line}`;
  }

  //* change #import to comment
  if (_line.startsWith("#include ")) {
    return `///INCLUDE ${line}`;
  }

  // [attr] interface [NAME] : [EXTEND_FROM] {}
  if (_line.startsWith("interface ")) {
    let interfaceName: string;
    let _tmp = _line.split(":");
    interfaceName = _tmp[0].replace("interface", "").replace("{", "").trim();
    if (!attribute?.values.includes("scriptable") && !_line.includes(";")) {
      not_scriptable_interface = true;
      return "";
    }
    if (_tmp.length > 1) {
      IDLType2TS(_tmp[1].replace("{", "").trim()); ///for add unresolved types
    }
    _line = "export " + _tmp.join(" extends ").replaceAll(/[ ]+/g, " ");
    if (_line.includes(";")) {
      _line = "///ONELINE_INTERFACE " + _line.replace(";", " {}");
    } else if (obj_export_ident) {
      obj_export_ident.interface.push(interfaceName);
    }
  }

  //* PROPERTY
  if (_line.startsWith("attribute ") || _line.startsWith("readonly ")) {
    _line = processProperty(_line, attribute);
  }
  //* CONST
  else if (_line.startsWith("const ")) {
    const _tmp = _line.split("=")[0].trim().replace("const ", "");
    const _type = IDLType2TS(_tmp.slice(0, _tmp.lastIndexOf(" ")));
    const _name = _tmp.slice(_tmp.lastIndexOf(" ") + 1);
    _line = `///CONST ${_line
      .split("=")[1]
      .trim()
      .replace(";", "")}\n${_name}: ${_type};\n`;
  }
  //* TYPEDEF
  else if (_line.startsWith("typedef ")) {
    const tokens = _line.split(" ");
    //0 is typedef keyword
    const type = IDLType2TS(tokens.slice(1, -1).join(" "));
    const name = tokens.slice(-1)[0].replace(";\n", "");
    _line = `export type ${name} = ${type};\n`;
    obj_export_ident.type.push(name);
  } else if (_line.startsWith("webidl ")) {
    const tokens = _line.split(" ");
    //0 is webidl keyword
    const name = _line[1].replace(";", "");
    addResolveTypes([name]);
    _line = `///WEBIDL ${name}`;
  }
  //* CENUM
  else if (line.startsWith("cenum ")) {
    _line = processCENUM(line);
  }
  //* INTERFACE
  else if (
    _line.startsWith("interface ") ||
    _line.endsWith("]") ||
    _line.endsWith("};")
  ) {
  } else if (_line.trim() === "") {
  }
  //* FUNCTION
  else if (_line.includes("(")) {
    _line = processFunction(_line, attribute);
    //if (_line && obj_export_ident) obj_export_ident.func.push(funcName);
  }

  return _line;
}
