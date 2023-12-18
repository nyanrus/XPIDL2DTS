import * as fs from "fs";

/**
 * REMOVE C++ Codes from IDL
 * that not used in JS
 * @param src Source Code to process
 * @returns Processed String
 */
function preprocess(src: string): string {
  //* REMOVE C++ Codes
  {
    src = src.replaceAll(/%{[\s\S]*?%}/g, "");
    const fd = fs.openSync("dst.d.ts", "w");

    fs.writeSync(fd, Buffer.from(src, "utf-8"));
  }

  //* REMOVE function newline
  {
    let buf = "";
    let pat_open = false;
    let before_is_space = false;
    for (let i = 0; i < src.length; i++) {
      if (src.charAt(i) === "(") {
        pat_open = true;
      } else if (src.charAt(i) === ")") {
        pat_open = false;
      }
      if (pat_open) {
        if (!before_is_space) {
          buf += src.charAt(i);
        }
      } else {
        buf += src.charAt(i);
      }
      before_is_space = src.charAt(i).trim() === " ";
    }
    src = buf;
  }

  //* move { to interface line
  {
    src = src.replaceAll(/\n{/g, " {");
  }
  return src;
}

enum Status {
  NORMAL,
  MULTI_COMMENT,
  INTERFACE,
  FUNCTION,
}

interface Attribute {
  values: string[];
  newline: boolean;
}

function IDLType2TS(str: string): string {
  const n = "number";
  const s = "string";
  //const i = "ID object";
  const i = "any";

  //https://firefox-source-docs.mozilla.org/xpcom/xpidl.html
  const map: Map<string, string> = new Map(
    Object.entries({
      boolean: "boolean",
      char: s,
      double: n,
      float: n,
      long: n,
      "long long": n,
      octet: n,
      short: n,
      string: n,
      "unsigned long": n,
      "unsigned long long": n,
      "unsigned short": n,
      //? START
      uint32_t: n,
      uint64_t: n,
      int32_t: n,
      bool: "boolean",
      int64_t: n,
      //? END
      wchar: s,
      wstring: s,
      MozExternalRefCountType: n,
      //TODO: TYPE
      "Array<T>": "any",
      //nsrootidl.idl
      PRTime: n,
      nsresult: n,
      size_t: n,

      nsIDRef: i,
      nsIIDRef: i,
      nsCIDRef: i,
      nsIDPtr: i,
      nsIIDPtr: i,
      nsCIDPtr: i,

      nsQIResult: "object",

      AUTF8String: s,
      ACString: s,
      AString: s,
      jsval: "any",
      Promise: "Promise<any>",
    })
  );
  const ret = map.get(str);
  return ret ? ret : str;
}

function processProperty(line: string): string {
  const _tmp = line.replace("attribute ", "").split(" ");
  const _name = _tmp.pop()?.replace(";", "").trim();
  if (!_name) {
    throw Error(`_name is undefined`);
  }
  const _type = _tmp.join(" ").trim();

  return _name + ": " + IDLType2TS(_type) + ",";
}

let tmp_processFunction = "";
let in_function = false;
function processFunction(line: string): string {
  console.warn(`pFline : ${line}`);
  //* FOR MULTILINE FUNCTION
  {
    if (!line.includes(");")) {
      tmp_processFunction += line;
      in_function = true;
      return "";
    } else {
      line = tmp_processFunction + line;
      tmp_processFunction = "";
      in_function = false;
    }
  }

  let _tmp = line.split(" ");
  let _ret_type = "";
  //* CHECK OUT VALUE
  while (true) {
    if (!_tmp[0].includes("(")) {
      _ret_type += _tmp[0] + " ";
      _tmp = _tmp.slice(1);
    } else {
      _ret_type = IDLType2TS(_ret_type.trimEnd());
      break;
    }
  }
  console.error(`_tmp: ${_tmp}`);
  const _func = (() => {
    let __func = _tmp.join(" ").split("(");
    if (__func.length > 2) {
      console.log(`__func: ${__func}`);
      const __ret = [__func[0], __func.slice(1, __func.length - 2).join("("), __func[__func.length - 1]];
      console.log(`__func ${__ret}`);
      return __ret;
    } else {
      return __func;
    }
  })();

  const funcName = _func[0];

  function processFuncArgs(args: string): string {
    if (args === "") return "";
    console.log(`args: ${args}`);
    let _attr: Attribute;

    let arr_args = args.split(",");
    let ret: string[] = [];

    {
      let _is_attr = false;
      let _buf = "";
      arr_args.forEach((i, idx) => {
        if (_is_attr) {
          _buf += i;
        }
        if (i.includes("[")) {
          _is_attr = true;
          _buf += i;
        }
      });
      if (_is_attr) {
        [_attr, _buf] = processAttribute(_buf);
        if (_attr.values.includes("retval")) {
          // ret_val is always on end
          _ret_type = IDLType2TS(_buf);
          arr_args = args.replace(/\[.*\].*/, "").split(",");
          console.log(`arr_args: ${arr_args}`);
        } else {
          arr_args = _buf.split(",");
        }
      }
    }

    for (let i of arr_args) {
      const arr = i.split(" ").filter((v) => v !== "");
      console.log(arr);
      // arr[0] is `in` or `out`
      let arg_name = arr[arr.length - 1].trim();
      if (arg_name === "function") {
        arg_name = "func";
      }
      ret.push(
        arg_name +
          ": " +
          IDLType2TS(
            arr
              .slice(1, arr.length - 1)
              .join(" ")
              .trim()
          )
      );
    }
    return ret.join(",");
  }

  let args: string;
  if (_func[1].startsWith(")")) {
    args = "";
  } else {
    args = processFuncArgs(_func[1].replace(");", ""));
  }

  console.log(`func: ${funcName}(${args}) : ${_ret_type},`);
  return `${funcName}(${args}) : ${_ret_type},`;

  //IDLType2TS(_ret_type)
}

function processAttribute(line: string): [Attribute, string] {
  const arr = line
    .slice(1, line.indexOf("]"))
    .split(",")
    .map((v) => {
      return v.trim();
    });

  //console.log(_out);
  const _out = line.slice(line.indexOf("]") + 1);
  attribute = { values: arr, newline: _out.trim() === "" };
  console.log(`ATTRIBUTE: ${attribute.values}`);
  return [attribute, _out.trimStart()];
}

let in_cenum = false;
let buf_cenum = "";
function processCENUM(line: string): string {
  if (!line.includes("}")) {
    in_cenum = true;
    buf_cenum += line.trim();
    return "";
  } else {
    const _tmp = buf_cenum.replace("cenum ", "").split("{");
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
    in_cenum = false;
    buf_cenum = "";
    return `//byte_num: ${byte_num.trim()};\n${enum_name}: {${inner_buf}}`;
  }
}

let attribute: Attribute | null = null;
let temp = "";
// because of MULTI_COMMENT IN INTERFACE
let origStatus: Status = Status.NORMAL;
let status: Status = Status.NORMAL;

function processLine(line: string): string {
  let readonly = false;
  //console.log(line);
  //console.log(status);
  //*NORMAL
  if (status === Status.NORMAL || status === Status.INTERFACE) {
    // temp is not used in NORMAL
    temp = "";
    //* COMMENT
    if (line.includes("/*")) {
      //single line
      if (line.includes("*/")) {
        //return "";
        return line + "\n";
      }
      // multi line
      else {
        origStatus = status;
        status = Status.MULTI_COMMENT;
        temp += line;
        return "";
      }
    } else {
      if (line.includes("//")) return line + "\n";
    }

    line = line.trimStart();

    //empty line
    if (line === "") {
      return "";
    } else if (line.trim() === "") {
      return "";
      return "\n";
    }

    //* CHECK IN FUNCTION
    if (in_function) {
      line = processFunction(line.trimStart());
    } else if (in_cenum) {
      line = processCENUM(line.trimStart());
    } else {
      //* ATTRIBUTE
      if (line.startsWith("[")) {
        [attribute, line] = processAttribute(line);
      }

      //* REJECT NATIVE
      if (line.startsWith("native")) {
        attribute = null;
        return "";
      }

      //* REJECT OBJECT NOT FOR JS
      if (attribute) {
        for (const i of attribute.values) {
          //console.log(i);
          if (i === "noscript") {
            attribute = null;
            return "";
          }
        }
      }

      //* change #import to comment
      if (line.startsWith("#include")) {
        line = "//TODO: " + line;
      }

      if (line.startsWith("interface")) {
        line = line.replace(":", "extends");
        if (!line.includes(";")) {
          status = Status.INTERFACE;
        } else {
          line = line.replace(";", " {}");
        }
      }

      if (status === Status.INTERFACE) {
        //* interface property(attribute keyword)
        if (line.startsWith("readonly ")) {
          readonly = true;
          line = line.split("readonly ")[1];
        }

        //* PROPERTY
        if (line.startsWith("attribute")) {
          line = processProperty(line);
        }
        //* CONST
        else if (line.startsWith("const")) {
          const _tmp = line.split("=")[0].trim().replace("const ", "");
          const _type = IDLType2TS(_tmp.slice(0, _tmp.lastIndexOf(" ")));
          const _name = _tmp.slice(_tmp.lastIndexOf(" ") + 1);
          line = `//const;${line.split("=")[1].trim().replace(";", "")}\n${_name}: ${_type},`;
        }
        //* CENUM
        else if (line.startsWith("cenum")) {
          line = processCENUM(line);
        }
        //* INTERFACE
        //else if (line.includes("(")) {
        else if (line.startsWith("interface") || line.startsWith("{") || line.endsWith("]")) {
          //does nothing
        }
        //* FUNCTION
        else {
          line = processFunction(line);
        }
        //console.log(line);
        //console.log(indent);

        if (line.includes("}")) status = Status.NORMAL;
      }
    }

    if (attribute) {
      const attributeString = "[" + attribute.values.join(", ") + "]";
      let _line = "//" + attributeString;
      if (attribute.newline) {
        _line += "\\n" + "\n";
      } else {
        _line +=
          "\n" +
          //+ " "
          (readonly ? "readonly" : "") +
          line +
          "\n\n";
      }
      line = _line;
    } else {
      //console.log(indent);
      line = (readonly ? "readonly " : "") + line + "\n";
      if (!(line.includes("interface") && !line.includes("{}"))) {
        line += "\n";
      }
    }
    attribute = null;

    line = line.replace("};", "}");
    return line;
  } else if (status === Status.MULTI_COMMENT) {
    if (line.includes("*/")) {
      temp += line + "\n";
      status = origStatus;
      //return "";
      return temp;
    } else {
      temp += line + "\n";
      return "";
    }
  }
  throw Error(`THIS CODE SHOULD NOT BE RUNNED`);
}

function process(src: string): string {
  let buf = "";
  for (const i of src.split("\n")) {
    //console.log(i);
    buf += processLine(i);
  }
  return buf;
}

function processAll4Test(root: string) {
  fs.readdirSync(root, { recursive: true, encoding: "utf-8" }).forEach((_file) => {
    if (!fs.statSync(root + _file).isDirectory() && _file.endsWith(".idl") && _file.includes("nsIMemoryReporter")) {
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
  //src: string
  processAll4Test("../nyanrus_Floorp/xpcom/");
  // const preprocessed = preprocess(src);
  // const processed = process(preprocessed);
  // const fd = fs.openSync("dst.d.ts", "w");

  // fs.writeSync(fd, Buffer.from(processed, "utf-8"));
}

main();
//fs.readFileSync("src.idl").toString()
