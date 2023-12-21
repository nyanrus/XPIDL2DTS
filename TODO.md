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
