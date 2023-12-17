import fs from "fs";

/**
 * REMOVE C++ Codes from IDL
 * that not used in JS
 * @param src Source Code to process
 * @returns Processed String
 */
function preprocess(src: string): string {
  let ret: string[] = [];
  const start = src.split("%{");
  for (const i of start) {
    if (i.includes("%}")) {
      ret.push(i.split("%}")[1]);
    } else {
      ret.push(i);
    }
  }
  return ret.join("");
}

enum Status {
  NORMAL,
  MULTI_COMMENT,
  INTERFACE,
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

function processFunction(line: string): string {
  //console.warn(line);
  function processFuncArgs(args: string): string {
    if (args === "") return "";
    //console.log(`args: ${args}`);
    const arr_args = args.split(",");
    let ret: string[] = [];
    for (const i of arr_args) {
      const arr = i.split(" ");
      //console.log(arr);
      // arr[0] is `in` or `out`
      ret.push(arr[2].trim() + ": " + IDLType2TS(arr[1].trim()));
    }
    return ret.join(",");
  }
  let _tmp = line.split(" ");
  let _ret_type = "";
  while (true) {
    let i: string;
    //console.log(_tmp);
    [i, ..._tmp] = _tmp;
    if (!i.includes("(")) {
      console.log(i);
      _ret_type += i + " ";
    } else {
      _ret_type = IDLType2TS(_ret_type.trimEnd());
      _tmp = [i, ..._tmp];
      break;
    }
  }
  //console.error(_tmp);
  const _func = _tmp.join(" ").split("(");

  const funcName = _func[0];
  let args: string;
  if (_func[1].startsWith(")")) {
    args = "";
  } else {
    args = processFuncArgs(_func[1].replace(");", ""));
  }

  console.log(`${funcName}(${args}) : ${_ret_type},`);
  return `${funcName}(${args}) : ${_ret_type},`;

  //IDLType2TS(_ret_type)
}

let attribute: Attribute | null = null;
let temp = "";
// because of MULTI_COMMENT IN INTERFACE
let origStatus: Status = Status.NORMAL;
let status: Status = Status.NORMAL;
let indent = 0;
let readonly = false;
function processLine(line: string): string {
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
        return line;
      }
      // multi line
      else {
        origStatus = status;
        status = Status.MULTI_COMMENT;
        temp += line;
        return "";
      }
    }

    // line = line.replace(" ", "  ");

    // console.warn(line);
    // console.warn(line.trimStart());
    indent = line.length - line.trimStart().length;
    //console.log(indent);
    line = line.trimStart();

    //empty line
    if (line === "") {
      return "";
    } else if (line.trim() === "") {
      return "";
      return "\n";
    }

    //* ATTRIBUTE
    if (line.startsWith("[")) {
      const [_attributes, _out] = line.trimStart().split("]");
      // slice to remove starting `[`
      const arr = _attributes.split("[")[1].split(",");
      for (const idx of arr.keys()) {
        arr[idx] = arr[idx].trim();
      }

      //console.log(_out);
      attribute = { values: arr, newline: _out.trim() === "" };
      line = _out.trim();
    }

    //* REJECT NATIVE
    if (line.startsWith("native")) {
      attribute = null;
      readonly = false;
      indent = 0;
      return "";
    }

    //* REJECT OBJECT NOT FOR JS
    if (attribute) {
      for (const i of attribute.values) {
        //console.log(i);
        if (i === "noscript") {
          attribute = null;
          readonly = false;
          indent = 0;
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

      if (line.startsWith("attribute")) {
        line = processProperty(line);
      } else if (line.includes("(")) {
        //* function
        line = processFunction(line);
      }
      //console.log(line);
      //console.log(indent);

      if (line.includes("}")) status = Status.NORMAL;
    }

    if (attribute) {
      const attributeString = "[" + attribute.values.join(", ") + "]";
      let _line = " ".repeat(indent) + "//" + attributeString;
      if (attribute.newline) {
        _line += "\\n" + "\n";
      } else {
        _line +=
          "\n" +
          " ".repeat(indent) +
          //+ " "
          (readonly ? "readonly" : "") +
          line +
          "\n\n";
      }
      line = _line;
    } else {
      console.log(indent);
      line = " ".repeat(indent) + (readonly ? "readonly " : "") + line + "\n";
      if (!(line.includes("interface") && !line.includes("{}"))) {
        line += "\n";
      }
    }
    readonly = false;
    attribute = null;
    indent = 0;

    line = line.replace("};", "}");
    return line;
  } else if (status === Status.MULTI_COMMENT) {
    if (line.includes("*/")) {
      temp += line;
      status = origStatus;
      //return "";
      return temp;
    } else {
      temp += line;
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

function main(src: string) {
  const preprocessed = preprocess(src);
  const processed = process(preprocessed);
  const fd = fs.openSync("dst.d.ts", "w");

  fs.writeSync(fd, Buffer.from(processed, "utf-8"));
}

main(fs.readFileSync("src.idl").toString());
