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

import { Components } from "./dist/p/index.js";

const arr = Components.classes["@mozilla"].createInstance(
  Components.interfaces.nsIArray,
);

arr.Components.interfaces.nsIMIMEInfo.alwaysAsk;

Components.interfaces.nsIArray;
