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
  //console.log(`property: ${line}`);
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
  return `${attr ? `//PROPERTY ${attr.toLine()}\n` : ""}${
    readonly ? "readonly " : ""
  }${name}:${type},`;
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
      if (
        !(
          tokens[index] === "in" ||
          tokens[index] === "out" ||
          tokens[index] === "inout"
        )
      )
        throw Error("function args not starts with `in` or `out` or `inout`");
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
  if (attr?.values.includes("noscript")) return "";
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
  return `${
    attr ? `//FUNCTION ${attr.toLine()}\n` : ""
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

function processLine(line: string): string {
  let attribute: Attribute | null = null;

  let _line = line;

  //console.log(`_line = ${_line}`);

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
      _line = "///ONELINE_INTERFACE " + _line.replace(";", " {}");
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
    _line = `//CONST ${_line
      .split("=")[1]
      .trim()
      .replace(";", "")}\n${_name}: ${_type};\n`;
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
  else if (
    _line.startsWith("interface") ||
    _line.endsWith("]") ||
    _line.endsWith("};")
  ) {
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
      const idx_next_newline = src.indexOf("\n", index);
      if (idx_next_newline === -1) {
        buf += processLine(src.slice(index));
        break;
      }
      buf += processLine(src.slice(index, idx_next_newline + 1));
      index = idx_next_newline + 1;
    }
  }
  // {
  //   buf = src;
  // }

  return buf;
}

function processAll4Test(root: string) {
  fs.readdirSync(root, { recursive: true, encoding: "utf-8" }).forEach(
    (_file) => {
      if (
        !fs.statSync(root + _file).isDirectory() &&
        _file.endsWith(".idl")
        //&& _file.includes("nsIMemoryReporter")
      ) {
        console.log(root + _file);
        const src = fs.readFileSync(root + _file).toString();
        const preprocessed = preprocess(src);
        {
          fs.mkdirSync(
            "dist/pp/xpcom/" +
              _file.replace("\\", "/").split("/").slice(0, -1).join("/"),
            { recursive: true },
          );
          const fd = fs.openSync(
            "dist/pp/xpcom/" +
              _file.replace("\\", "/").replace(".idl", ".d.ts"),
            "w",
          );

          fs.writeSync(fd, Buffer.from(preprocessed, "utf-8"));
        }

        const processed = process(preprocessed);

        const path = _file.replace("\\", "/").split("/");
        path.pop();

        console.log("xpcom/" + path.join("/"));
        fs.mkdirSync("dist/p/xpcom/" + path.join("/"), { recursive: true });
        const fd = fs.openSync(
          "dist/p/xpcom/" + _file.replace(".idl", ".d.ts"),
          "w",
        );
        fs.writeSync(fd, Buffer.from(processed, "utf-8"));
      } else if (fs.statSync(root + _file).isDirectory()) {
      }
    },
  );
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
  {
    //     const testData = `
    // /**
    // * The status of a given normandy experiment.
    // */
    // cenum ExperimentStatus : 8 {
    // // The user is not actively enrolled in the experiment.
    // eExperimentStatusUnenrolled = 0,
    // // The user is enrolled in the control group, and should see the default
    // // behavior.
    // eExperimentStatusControl = 1,
    // // The user is enrolled in the treatment group, and should see the
    // // experimental behavior which is being tested.
    // eExperimentStatusTreatment = 2,
    // // The user was enrolled in the experiment, but became ineligible due to
    // // manually modifying a relevant preference.
    // eExperimentStatusDisqualified = 3,
    // // The user was selected for the phased Fission rollout.
    // eExperimentStatusRollout = 4,
    // eExperimentStatusCount,
    // };
    // // If you update this enum, don't forget to raise the limit in
    // // TelemetryEnvironmentTesting.sys.mjs and record the new value in
    // // environment.rst
    // cenum ContentWin32kLockdownState : 8 {
    // LockdownEnabled = 1,  // no longer used
    // MissingWebRender = 2,
    // OperatingSystemNotSupported = 3,
    // PrefNotSet = 4,  // no longer used
    // MissingRemoteWebGL = 5,
    // MissingNonNativeTheming = 6,
    // DisabledByEnvVar = 7,  // - MOZ_ENABLE_WIN32K is set
    // DisabledBySafeMode = 8,
    // DisabledByE10S = 9,      // - E10S is disabled for whatever reason
    // DisabledByUserPref = 10,  // - The user manually set
    // // security.sandbox.content.win32k-disable to false
    // EnabledByUserPref = 11,  // The user manually set
    // // security.sandbox.content.win32k-disable to true
    // DisabledByControlGroup =
    // 12,  // The user is in the Control Group, so it is disabled
    // EnabledByTreatmentGroup =
    // 13,  // The user is in the Treatment Group, so it is enabled
    // DisabledByDefault = 14,  // The default value of the pref is false
    // EnabledByDefault = 15,    // The default value of the pref is true
    // DecodersArentRemote = 16,
    // IncompatibleMitigationPolicy = 17, // Some incompatible Windows Exploit Mitigation policies are enabled
    // };
    //     `;
    //     preprocess(testData);
  }
  {
    // const testData = `/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
    // /* This Source Code Form is subject to the terms of the Mozilla Public
    //  * License, v. 2.0. If a copy of the MPL was not distributed with this
    //  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
    // #include "nsISupports.idl"
    // interface nsIObserver;
    // interface nsISimpleEnumerator;
    // /**
    //  * nsIObserverService
    //  *
    //  * Service allows a client listener (nsIObserver) to register and unregister for
    //  * notifications of specific string referenced topic. Service also provides a
    //  * way to notify registered listeners and a way to enumerate registered client
    //  * listeners.
    //  */
    // [scriptable, builtinclass, uuid(D07F5192-E3D1-11d2-8ACD-00105A1B8860)]
    // interface nsIObserverService : nsISupports
    // {
    //     /**
    //      * AddObserver
    //      *
    //      * Registers a given listener for a notifications regarding the specified
    //      * topic.
    //      *
    //      * @param anObserve : The interface pointer which will receive notifications.
    //      * @param aTopic    : The notification topic or subject.
    //      * @param ownsWeak  : If set to false, the nsIObserverService will hold a
    //      *                    strong reference to |anObserver|.  If set to true and
    //      *                    |anObserver| supports the nsIWeakReference interface,
    //      *                    a weak reference will be held.  Otherwise an error will be
    //      *                    returned.
    //      */
    //     void addObserver( in nsIObserver anObserver, in string aTopic,
    //                       [optional] in boolean ownsWeak);
    //     /**
    //      * removeObserver
    //      *
    //      * Unregisters a given listener from notifications regarding the specified
    //      * topic.
    //      *
    //      * @param anObserver : The interface pointer which will stop recieving
    //      *                     notifications.
    //      * @param aTopic     : The notification topic or subject.
    //      */
    //     void removeObserver( in nsIObserver anObserver, in string aTopic );
    //     /**
    //      * notifyObservers
    //      *
    //      * Notifies all registered listeners of the given topic.
    //      * Must not be used with shutdown topics (will assert
    //      * on the parent process).
    //      *
    //      * @param aSubject : Notification specific interface pointer.
    //      * @param aTopic   : The notification topic or subject.
    //      * @param someData : Notification specific wide string.
    //      */
    //     void notifyObservers( in nsISupports aSubject,
    //                           in string aTopic,
    //                           [optional] in wstring someData );
    //     /**
    //      * hasObservers
    //      *
    //      * Checks to see if there are registered listeners for the given topic.
    //      *
    //      * Implemented in "nsObserverService.cpp".
    //      *
    //      * @param aTopic   : The notification topic or subject.
    //      * @param aFound : An out parameter; True if there are registered observers,
    //      * False otherwise.
    //      */
    //     [noscript, notxpcom, nostdcall] boolean hasObservers(in string aTopic);
    //     %{C++
    //     /**
    //      * notifyWhenScriptSafe
    //      *
    //      * Notifies all registered listeners of the given topic once it is safe to
    //      * run script.
    //      *
    //      * Implemented in "nsObserverService.cpp".
    //      *
    //      * @param aSubject : Notification specific interface pointer.
    //      * @param aTopic   : The notification topic or subject.
    //      * @param someData : Notification specific wide string.
    //      */
    //     nsresult NotifyWhenScriptSafe(nsISupports* aSubject,
    //                                   const char* aTopic,
    //                                   const char16_t* aData = nullptr);
    //     %}
    //     /**
    //      * enumerateObservers
    //      *
    //      * Returns an enumeration of all registered listeners.
    //      *
    //      * @param aTopic   : The notification topic or subject.
    //      */
    //     nsISimpleEnumerator enumerateObservers( in string aTopic );
    // };
    // `;
    // preprocess(testData);
  }
}

main();
