export function IDLType2TS(str: string): string {
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
      // uint32_t: n,
      // uint64_t: n,
      // int32_t: n,
      // bool: "boolean",
      // int64_t: n,
      //? END
      wchar: s,
      wstring: s,
      MozExternalRefCountType: n,
      //TODO: TYPE
      "Array<T>": "any",
      //nsrootidl.idl
      //PRTime: n,
      //nsresult: n,
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
