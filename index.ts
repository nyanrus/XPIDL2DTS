import * as fs from "fs";
import { IDLType2TS } from "./idltype";
import { preprocess } from "./preprocess";
import { Attribute } from "./defines";

/**
 * in interface parse
 * `[ATTR] [readonly] attribute [TYPE] [NAME];`
 * to `//PROPERTY [ATTR]\n [readonly] name:type,`
 * @param line line of source
 * @param attr Attribute in this line.
 * if attr contains noscript, return just COMMENT
 * @returns processed line
 */
function processProperty(line: string, attr: Attribute | null): string {
  const tokens = line.split(" ");
  let index = 0;

  let readonly = false;
  let type: string;
  let name: string;
  if (attr?.values.includes("noscript")) {
    return `///NOSCRIPT ${line}`;
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
    type = IDLType2TS(tokens[index]);
    index += 1;
  }
  //* [NAME]
  {
    name = tokens[index].replace(";", "");
  }
  //`//PROPERTY [ATTR]\n [readonly] name:type,`
  return `${attr ? `//PROPERTY ${attr.toLine()}\n` : ""}${readonly ? "readonly " : ""}${name}:${type},`;
}

/**
 *
 * @param raw_args
 * @return [args, retval?]
 */
function processFuncArgs(raw_args: string): [string, string | null] {
  let arr_args: string[] = [];
  //* split to tokens
  {
    console.log("split token");
    let index = 0;
    while (index < raw_args.length) {
      let _buf = "";
      if (raw_args.startsWith("[", index)) {
        const idx_end_square_bracket = raw_args.indexOf("]", index) + 1;
        _buf += raw_args.slice(index, idx_end_square_bracket);
        index = idx_end_square_bracket;
      }
      const idx_comma = raw_args.indexOf(",", index) + 1;
      console.log(`idx_comma : ${idx_comma}`);
      if (idx_comma === 0) {
        arr_args.push(raw_args);
        break;
      }
      _buf += raw_args.slice(index, idx_comma);
      index = idx_comma;
      arr_args.push(_buf);
      //* remove whitespace after comma
      while (raw_args[index] === " ") {
        index += 1;
      }
    }
    console.log("split end");
  }
  let ret_type_retval: string | null = null;
  let ret_args = [];
  for (const elem of arr_args) {
    let _attribute: Attribute | null;
    let _elem: string;
    //* attribute
    {
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

    //* `in` or `out`
    {
      if (!(tokens[index] === "in" || tokens[index] === "out")) throw Error("function args not starts with `in` or `out`");
      index += 1;
    }
    //* [TYPE]
    {
      type = IDLType2TS(tokens[index]);
      index += 1;
    }
    //* [NAME]
    {
      name = tokens[index];
      index += 1;
    }

    //* check retval of attribute
    if (_attribute?.values.includes("retval")) {
      ret_type_retval = type;
    } else {
      ret_args.push(`${type}: ${name},//${tokens[0]}\n`);
    }
  }
  return [ret_args.join(","), ret_type_retval];
}

function processFunction(line: string, attr: Attribute | null): string {
  console.log("processFunction start");
  console.log(line);
  const [_first, _second] = line.split("(");
  console.log(`${_first}, ${_second}`);

  const [func_name, ret_type] = (() => {
    const _arr_first = _first.split(" ");
    return [_arr_first.pop(), _arr_first.join(" ")];
  })();

  const raw_args = _second.replace(");", "").trim();
  console.log(raw_args);

  let args: string;
  let args_retval: string | null;
  if (raw_args) {
    [args, args_retval] = processFuncArgs(raw_args);
  } else {
    [args, args_retval] = ["", null];
  }

  console.log("return FUNCTION");
  console.log(`${attr ? `//FUNCTION ${attr.toLine()}\n` : ""}${func_name}: (${args}) : ${args_retval ? args_retval : ret_type}`);
  //console.log(attr.values);
  return `${attr ? `//FUNCTION ${attr.toLine()}\n` : ""}${func_name}: (${args}) => ${args_retval ? args_retval : ret_type};`;
}
//TODO
function processCENUM(line: string): string {
  {
    const _tmp = line.replace("cenum ", "").split("{");
    const [enum_name, byte_num] = _tmp[0].split(":");
    const inner = _tmp[1]
      .replace("};", "")
      .split(",")
      .map((v) => {
        return v.trim();
      });

    let inner_buf = "";

    let num = 0;
    for (const i of inner) {
      const _split = i.split("=");
      console.log(`i = ${i}`);
      console.log(`_split = ${_split}`);
      if (_split.length > 1) {
        num = Number(_split[1].trim());
      }
      inner_buf += `${_split[0].trim()} : ${num},`;
      num += 1;
    }
    return `//byte_num: ${byte_num.trim()};\n${enum_name}: {${inner_buf}}`;
  }
}

function processLine(line: string): string {
  let attribute: Attribute | null = null;

  let _line = line;

  //* ATTRIBUTE
  if (_line.startsWith("[")) {
    [attribute, _line] = Attribute.fromLine(_line);
  }

  //* REJECT NATIVE
  //TODO: move to some function
  if (_line.startsWith("native")) {
    return `///NATIVE METHOD ${line}`;
  }

  //* change #import to comment
  if (_line.startsWith("#include")) {
    return `///INCLUDE ${line}`;
  }

  if (_line.startsWith("interface")) {
    _line = _line.replace(":", "extends");
    if (_line.includes(";")) {
      _line = _line.replace(";", " {}");
    }
  }

  //* PROPERTY
  if (_line.startsWith("attribute") || _line.startsWith("readonly")) {
    _line = processProperty(_line, attribute);
  }
  //* CONST
  else if (_line.startsWith("const")) {
    const _tmp = _line.split("=")[0].trim().replace("const ", "");
    const _type = IDLType2TS(_tmp.slice(0, _tmp.lastIndexOf(" ")));
    const _name = _tmp.slice(_tmp.lastIndexOf(" ") + 1);
    _line = `//CONST\n${_line.split("=")[1].trim().replace(";", "")}\n${_name}: ${_type},`;
  }
  // //* CENUM
  // else if (line.startsWith("cenum")) {
  //   line = processCENUM(line);
  // }
  //* INTERFACE
  else if (_line.startsWith("interface") || _line.endsWith("]") || _line.endsWith("};")) {
  } else if (_line.trim() === "") {
  }
  //* FUNCTION
  else if (_line.includes("(")) {
    _line = processFunction(_line, attribute);
  }

  return _line;
}

function process(src: string): string {
  let buf = "";
  let index = 0;
  while (index < src.length) {
    //* MULTICOMMENT
    if (src.startsWith("/*", index)) {
      const idx_end_multicomment = src.indexOf("*/", index) + 2;
      buf += src.slice(index, idx_end_multicomment);
      index = idx_end_multicomment;
    }
    //* SINGLECOMMENT
    else if (src.startsWith("//", index)) {
      const idx_next_newline = src.indexOf("\n", index) + 1;
      buf += src.slice(index, idx_next_newline);
      index = idx_next_newline;
    }
    //* NORMAL
    else {
      const idx_next_newline = src.indexOf("\n", index) + 1;
      buf += processLine(src.slice(index, idx_next_newline));
      index = idx_next_newline;
    }
  }
  // {
  //   buf = src;
  // }

  return buf;
}

function processAll4Test(root: string) {
  fs.readdirSync(root, { recursive: true, encoding: "utf-8" }).forEach((_file) => {
    if (
      !fs.statSync(root + _file).isDirectory() &&
      _file.endsWith(".idl")
      //&& _file.includes("nsIMemoryReporter")
    ) {
      console.log(root + _file);
      const src = fs.readFileSync(root + _file).toString();
      const preprocessed = preprocess(src);
      const processed = process(preprocessed);

      const path = _file.replace("\\", "/").split("/");
      path.pop();

      console.log("xpcom/" + path.join("/"));
      fs.mkdirSync("xpcom/" + path.join("/"), { recursive: true });
      const fd = fs.openSync("xpcom/" + _file.replace(".idl", ".d.ts"), "w");
      fs.writeSync(fd, Buffer.from(processed, "utf-8"));
    } else if (fs.statSync(root + _file).isDirectory()) {
    }
  });
}

function main() {
  processAll4Test("../nyanrus_Floorp/xpcom/");
}

main();
