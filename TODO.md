# TODOs

```bash
@types/firefox/js/xpconnect/tests/idl/xpctest_cenums.d.ts
[error] @types/firefox/js/xpconnect/tests/idl/xpctest_cenums.d.ts: SyntaxError: Type expected. (15:19)
[error]   13 | readonly testConst: number;
[error]   14 | ///CENUM {
[error] > 15 | testFlagsExplicit::{shouldBe1Explicit:1;shouldBe2Explicit:2;shouldBe4Explicit:4;shouldBe8Explicit:8;shouldBe12Explicit:NaN;}
[error]      |                   ^
[error]   16 | ///CENUM {
[error]   17 | testFlagsImplicit::{shouldBe0Implicit:0;shouldBe1Implicit:1;shouldBe2Implicit:2;shouldBe3Implicit:3;shouldBe5Implicit:5;shouldBe6Implicit:6;shouldBe2AgainImplicit:2;shouldBe3AgainImplicit:3;}
[error]   18 | testCEnumInput: (abc: nsIXPCTestCEnums_testFlagsExplicit,///in
```

it is not critical for using
