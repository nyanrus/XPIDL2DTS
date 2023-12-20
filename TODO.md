dist/p/xpcom/ds/nsIPropertyBag2.d.ts
[error] dist/p/xpcom/ds/nsIPropertyBag2.d.ts: SyntaxError: Property or signature expected. (9:1)
[error] 7 | // Accessing a property as a different type may attempt conversion to the
[error] 8 | // requested value
[error] > 9 | : (prop: string,//in
[error] | ^
[error] 10 | ) => int32_t getPropertyAsInt32;
[error] 11 | : (prop: string,//in
[error] 12 | ) => uint32_t getPropertyAsUint32;

dist/p/xpcom/ds/nsIWritablePropertyBag2.d.ts
[error] dist/p/xpcom/ds/nsIWritablePropertyBag2.d.ts: SyntaxError: Property or signature expected. (7:1)
[error] 5 | ///INCLUDE #include "nsIPropertyBag2.idl"
[error] 6 | interface nsIWritablePropertyBag2 extends nsIPropertyBag2 {
[error] > 7 | : (prop: string,//in
[error] | ^
[error] 8 | value: int32_t,//in
[error] 9 | ) => void setPropertyAsInt32;
[error] 10 | : (prop: string,//in

dist/p/xpcom/io/nsIConverterInputStream.d.ts
[error] dist/p/xpcom/io/nsIConverterInputStream.d.ts: SyntaxError: Property or signature expected. (39:1)
[error] 37 | _ byte sequences are encountered in the stream.
[error] 38 | _/
[error] > 39 | : (aStream: nsIInputStream,//in
[error] | ^
[error] 40 | aCharset: number,//in
[error] 41 | aBufferSize: number,//in
[error] 42 | aReplacementChar: char16_t,//in

dist/p/xpcom/io/nsIDirectoryService.d.ts
[error] dist/p/xpcom/io/nsIDirectoryService.d.ts: SyntaxError: '{' expected. (13:46)
[error] 11 | _ Used by Directory Service to get file locations.
[error] 12 | _/
[error] > 13 | interface nsIDirectoryServiceProviderextends nsISupports {
[error] | ^
[error] 14 | /\*_
[error] 15 | _ getFile
[error] 16 | \*

dist/p/xpcom/system/nsIGIOService.d.ts
[error] dist/p/xpcom/system/nsIGIOService.d.ts: SyntaxError: ';' expected. (21:78)
[error] 19 | //CONST 2
[error] 20 | EXPECTS_URIS_FOR_NON_FILES: number,
[error] > 21 | readonly id:string,readonly command:string,readonly supportedURISchemes:long expectsURIs; // see constants above readonly attribute nsIUTF8StringEnumerator,setAsDefaultForMimeType: (mimeType: string,//in
[error] | ^
[error] 22 | ) => void;
[error] 23 | setAsDefaultForFileExtensions: (extensions: string,//in
[error] 24 | ) => void;

dist/p/xpcom/system/nsIXULRuntime.d.ts
[error] dist/p/xpcom/system/nsIXULRuntime.d.ts: SyntaxError: '}' expected. (215:1)
[error] 213 | \*/
[error] 214 | readonly lastAppBuildID:string,};
[error] > 215 |
[error] | ^
