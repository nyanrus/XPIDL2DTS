import * as fs from "fs/promises";
import * as fg from "fast-glob";
import { preprocess } from "./src/preprocess.js";
import { isEmpty } from "./src/clean_empty_dts.js";
import { processLine } from "./src/funcs.js";
import { getExportFromDir } from "./src/export2list.js";
import { getUnresolvedTypes, resetUnresolvedTypes } from "./src/idltype.js";
import { parseIncludeFromDir } from "./src/include2import.js";

function process(src: string): string {
  resetUnresolvedTypes();
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

  return buf;
}

async function processAll4Test(root: string[]) {
  console.log("processing");
  // throw Error(
  //   JSON.stringify(
  //     root.map((v) => {
  //       return v + "/" + "**/*.idl";
  //     }),
  //   ),
  // );
  const files = await fg.default(
    root.map((v) => {
      return v + "/" + "**/*.idl";
    }),
    { dot: true },
  );

  for (const _file of files) {
    console.log(_file);
    if (!_file.includes("node_modules") && !_file.includes("other-licenses")) {
      //console.log(_file);
      //console.log(_file.name);

      const path =
        _file.replace("\\", "/").split("/").slice(0, -1).join("/") + "/";
      console.log(_file);
      const src = (await fs.readFile(_file)).toString();
      const preprocessed = preprocess(src);
      await fs.mkdir("dist/pp/" + path.replace("../", ""), {
        recursive: true,
      });

      await fs.writeFile(
        "dist/pp/" + _file.replace("../", "").replace(".idl", ".d.ts"),
        preprocessed,
      );
      const processed = process(preprocessed);

      if (_file.includes("nsIArray.idl")) {
        fs.writeFile(
          "nsIArray.d.ts",

          processed,
        );
      }

      //console.log(path);
      if (!isEmpty(processed)) {
        await fs.mkdir("dist/p/" + path.replace("../", ""), {
          recursive: true,
        });
        fs.writeFile(
          "dist/p/" + _file.replace("../", "").replace(".idl", ".d.ts"),
          processed,
        );
      }
    }
  }
  const exports = await getExportFromDir("dist");
  await fs.writeFile("./exports.json", JSON.stringify(exports));
  parseIncludeFromDir("dist", exports);
}

function main() {
  {
    processAll4Test([
      "../nyanrus_Floorp/xpcom",
      "../nyanrus_Floorp/netwerk/mime",
    ]);
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
