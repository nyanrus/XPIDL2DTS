import {
  nsIXPCComponents,
  nsIXPCComponents_Classes,
  nsIXPCComponents_Constructor,
  nsIXPCComponents_Exception,
  nsIXPCComponents_ID,
  nsIXPCComponents_Interfaces,
  nsIXPCComponents_Results,
  nsIXPCComponents_Utils,
} from "./dist/p/js/xpconnect/idl/xpccomponents.js";

import { Components, Cc, Ci } from "./dist/p/index.js";

Cc["@mozilla"].createInstance(Ci.nsIArray);
////import type { getKey } from "./dist/p/index.js";

Components.interfaces.nsIFile;

//type a = getKey<nsIArray>;\
Components.interfaces.nsIArray.$name;

const arr = Components.classes["@mozilla"].createInstance(
  Components.interfaces.nsIArray,
);

Components.interfaces.nsIArray;
