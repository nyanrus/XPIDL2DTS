import * as fs from "fs";

/**
 * @param src Source Code to process
 * @returns Processed String
 */
export function preprocess(src: string): string {
  //* REMOVE C++ Codes
  {
    src = src.replaceAll(/%{[\s\S]*?%}/g, "");
  }

  //* remove indent
  {
    src = src
      .split("\n")
      .map((v) => {
        return v.trim();
      })
      .join("\n");
  }

  {
    //* remove empty line
    src = src.replaceAll(/[\n]+/g, "\n");
  }

  {
    src = src.replaceAll("\n{", " {");
    src = src.replaceAll("]\n", "] ");
  }

  let buf = "";
  let index = 0;
  while (index < src.length) {
    console.log(`START\n${src.slice(index)}\nEND`);
    //console.log(index);
    //console.log(src.length);
    //console.log("START\n" + src.slice(index) + "\nEND\n");
    //* MULTICOMMENT
    if (src.startsWith("/*", index)) {
      const idx_end_multicomment = src.indexOf("*/\n", index);
      if (idx_end_multicomment === -1) {
        buf += src.slice(index);
        break;
      }
      buf += src.slice(index, idx_end_multicomment + 3);
      //console.log(src.slice(index, idx_end_multicomment + 3));
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
      //console.log(src.slice(index, idx_next_newline + 1));
      index = idx_next_newline + 1;
    }
    //* END of interface
    else if (src.startsWith("};\n", index)) {
      buf += src.slice(index, index + 3);
      index += 3;
    }
    //* #include
    else if (src.startsWith("#include", index)) {
      const idx_newline = src.indexOf("\n", index);
      buf += src.slice(index, idx_newline + 1);
      index = idx_newline + 1;
    } else if (src.startsWith("cenum", index)) {
      console.log(`CENUM`);
      const idx_semicolon = src.indexOf("};\n", index);
      const idx_end = idx_semicolon;
      console.log(idx_end);
      if (idx_end === -1) {
        buf += src.slice(index);
        break;
      }

      buf +=
        src
          .slice(index, idx_end + 3)
          .replaceAll(/\/\/.*\n/g, "") //TODO: process comments in cenum
          .replaceAll(/[ ]+|\n/g, " ")
          .trim() + "\n";
      index = idx_end + 3;
    }
    //* NORMAL
    else {
      const idx_semicolon = src.indexOf(";", index);
      const idx_open_square_bracket = src.indexOf("{", index);

      let idx_end = -1;
      const arr_idx = [idx_semicolon, idx_open_square_bracket].sort((a, b) => {
        return a - b;
      });

      console.log(`arr_index : ${arr_idx}`);

      idx_end = arr_idx[0] !== -1 ? arr_idx[0] : arr_idx[1];

      console.log(idx_end);

      if (idx_end === -1) {
        buf += src.slice(index);
        break;
      }
      buf +=
        src
          .slice(index, idx_end + 1)
          .replaceAll(/[ \n]+/g, " ")
          .replace(" ;", ";")
          .trim() + "\n";
      index = idx_end + 1;
      if (src[index] === "\n") index += 1;
    }
  }

  // {
  //   buf = buf.replaceAll(" (", "(");
  // }

  // //* include to comment
  // {
  //   src = src.replaceAll("#include", "//#include");
  // }

  // //* move interface attribute interface line
  // {
  //   src = src.replaceAll(/]\n/g, "] ");
  // }

  // //* flatten
  // {
  //   //* remove multiple empty line
  //   src = src.replaceAll(/\n[\n]+/g, "\n\n");

  //   // //* flat base on paren
  //   // {
  //   //   let _index = 0;
  //   //   while (true) {
  //   //     const start_paren = src.indexOf("(", _index);
  //   //     if (start_paren === -1) {
  //   //       break;
  //   //     }
  //   //     const end_paren = src.indexOf(")", start_paren);

  //   //     //console.log(`${start_paren} : ${end_paren}`);
  //   //     src = src.slice(0, start_paren) + src.slice(start_paren, end_paren).replaceAll(/[ ]+/g, " ").replaceAll("\n", "") + src.slice(end_paren);
  //   //     const end_paren_re = src.indexOf(")", start_paren);
  //   //     _index = end_paren_re;
  //   //   }
  //   // }
  //   //* flat base on `;`(function) or `{`(interface)
  //   {
  //     let _index = 0;
  //     while (true) {
  //       //skip single_comment
  //       if (src.startsWith("//", _index)) {
  //         _index = src.indexOf("\n", _index);
  //       }
  //       const idx_end_multicomment = src.indexOf("*/", _index);
  //       if (idx_end_multicomment === -1) {
  //         break;
  //       }
  //       const idx_semicolon = src.indexOf(";", idx_end_multicomment) + 1;
  //       const idx_semiparen = src.indexOf("{", idx_end_multicomment) + 1;

  //       const idx_end = idx_semicolon > idx_semiparen ? idx_semicolon : idx_semiparen;
  //       const idx_start = src.lastIndexOf("*/", idx_end) + 1;

  //       src = src.slice(0, idx_start) + src.slice(idx_start, idx_end).replaceAll(/[ ]+/g, " ").replaceAll("\n", "") + src.slice(idx_end);
  //       _index = idx_end;
  //     }
  //   }

  //   //* flat cenum
  //   {
  //     let _index = 0;
  //     while (true) {
  //       const idx_cenum = src.indexOf("cenum", _index);
  //       if (idx_cenum === -1) {
  //         break;
  //       }
  //       const idx_end_semiparen = src.indexOf("}", idx_cenum);
  //       const idx_start = idx_cenum;
  //       const idx_end = idx_end_semiparen;
  //       //console.log(`${start_paren} : ${end_paren}`);
  //       src = src.slice(0, idx_start) + src.slice(idx_start, idx_end).replaceAll(/[ ]+/g, " ").replaceAll("\n", "") + src.slice(idx_end);
  //       const idx_end_re = src.indexOf(")", idx_start);
  //       _index = idx_end_re;
  //     }
  //   }
  // }

  // {
  //   src = src.replaceAll(/;[\n]*/g, ";\n");
  // }

  return buf;
}
