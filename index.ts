import * as fs from "fs";
import { IDLType2TS } from "./src/idltype";
import { preprocess } from "./src/preprocess";
import { Attribute } from "./src/defines";

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
  console.log(`proprety: ${line}`);
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
    type = IDLType2TS(tokens.slice(index, -1).join(" "));
  }
  //* [NAME]
  {
    name = tokens.slice(-1)[0].replaceAll(/[;\n]/g, "");
    if (name === "function") name = "_function";
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

    //* `in` or `out` or `inout`
    {
      if (!(tokens[index] === "in" || tokens[index] === "out" || tokens[index] === "inout")) throw Error("function args not starts with `in` or `out` or `inout`");
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
      ret_args.push(`${name}: ${type},//${tokens[0]}\n`);
    }
  }
  return [ret_args.join(""), ret_type_retval];
}

function processFunction(line: string, attr: Attribute | null): string {
  //console.log("processFunction start");
  //console.log(line);
  const _first = line.slice(0, line.indexOf("("));
  const _second = line.slice(line.indexOf("(") + 1);
  //console.log(`${_first}, ${_second}`);

  const [func_name, ret_type] = (() => {
    const _arr_first = _first.split(" ");
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

  //console.log("return FUNCTION");
  //console.log(`${attr ? `//FUNCTION ${attr.toLine()}\n` : ""}${func_name}: (${args}) : ${args_retval ? args_retval : ret_type}`);
  //console.log(attr.values);
  return `${attr ? `//FUNCTION ${attr.toLine()}\n` : ""}${func_name}: (${args}) => ${args_retval ? args_retval : ret_type};\n`;
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
  return `///CENUM\n${name}:{${inner}}\n`;
}

function processLine(line: string): string {
  let attribute: Attribute | null = null;

  let _line = line;

  console.log(`_line = ${_line}`);

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
    _line = _line.replace(":", " extends ");
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
    _line = `//CONST ${_line.split("=")[1].trim().replace(";", "")}\n${_name}: ${_type};\n`;
  }
  //* TYPEDEF
  else if (_line.startsWith("typedef")) {
    const tokens = _line.split(" ");
    //0 is typedef keyword
    const type = IDLType2TS(tokens.slice(1, -1).join(" "));
    const name = tokens.slice(-1)[0].replace(";\n", "");
    _line = `type ${name} = ${type};\n`;
  }
  //* CENUM
  else if (line.startsWith("cenum")) {
    _line = processCENUM(line);
  }
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
      {
        fs.mkdirSync("dist/pp/xpcom/" + _file.replace("\\", "/").split("/").slice(0, -1).join("/"), { recursive: true });
        const fd = fs.openSync("dist/pp/xpcom/" + _file.replace("\\", "/").replace(".idl", ".d.ts"), "w");

        fs.writeSync(fd, Buffer.from(preprocessed, "utf-8"));
      }

      const processed = process(preprocessed);

      const path = _file.replace("\\", "/").split("/");
      path.pop();

      console.log("xpcom/" + path.join("/"));
      fs.mkdirSync("dist/p/xpcom/" + path.join("/"), { recursive: true });
      const fd = fs.openSync("dist/p/xpcom/" + _file.replace(".idl", ".d.ts"), "w");
      fs.writeSync(fd, Buffer.from(processed, "utf-8"));
    } else if (fs.statSync(root + _file).isDirectory()) {
    }
  });
}

function main() {
  {
    processAll4Test("../nyanrus_Floorp/xpcom/");
  }
  {
    // const testData = `/**
    // * Request the process to log a message for a target and level from Rust code.
    // *
    // * @param aTarget the string representing the log target.
    // * @param aMessage the string representing the log message.
    // */
    // void rustLog(in string aTarget,
    // in string aMessage);
    // /**
    // * Cause an Out of Memory Crash.
    // */
    // void crashWithOOM();
    //   `;
    // preprocess(testData);
  }

  {
    //   const testData = `/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
    // /* This Source Code Form is subject to the terms of the Mozilla Public
    // * License, v. 2.0. If a copy of the MPL was not distributed with this
    // * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
    // #include "nsISupports.idl"
    // interface nsIConsoleListener;
    // interface nsIConsoleMessage;
    // [scriptable, builtinclass, uuid(0eb81d20-c37e-42d4-82a8-ca9ae96bdf52)]interface nsIConsoleService : nsISupports{
    // void logMessage(in nsIConsoleMessage message);
    // // This helper function executes 'function' and redirects any exception
    // // that may be thrown while running it to the DevTools Console currently
    // // debugging 'targetGlobal'.
    // //
    // // This helps flag the nsIScriptError with a particular innerWindowID
    // // which is especially useful for WebExtension content scripts
    // // where script are running in a Sandbox whose prototype is the content window.
    // // We expect content script exception to be flaged with the content window
    // // innerWindowID in order to appear in the tab's DevTools.
    // [implicit_jscontext]jsval callFunctionAndLogException(in jsval targetGlobal, in jsval function);
    // // This is a variant of LogMessage which allows the caller to determine
    // // if the message should be output to an OS-specific log. This is used on
    // // B2G to control whether the message is logged to the android log or not.
    // cenum OutputMode : 8 {
    // SuppressLog = 0,OutputToLog};
    // void logMessageWithMode(in nsIConsoleMessage message,in nsIConsoleService_OutputMode mode);
    // `;
    //   process(testData);
  }
}

main();
