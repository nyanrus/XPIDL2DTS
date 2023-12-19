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
        return v.trimStart();
      })
      .join("\n");
  }

  //* include to comment
  {
    src = src.replaceAll("#include", "//#include");
  }

  //* move interface attribute interface line
  {
    src = src.replaceAll(/]\n/g, "] ");
  }

  //* move { to interface line
  {
    src = src.replaceAll(/\n{/g, " {");
  }
  //* flatten
  {
    //* remove multiple empty line
    src = src.replaceAll(/\n[\n]+/g, "\n\n");

    //* flat base on `;`(function) or `{`(interface)
    {
      let _index = 0;
      while (true) {
        const idx_end_multicomment = src.indexOf("*/", _index);
        if (idx_end_multicomment === -1) {
          break;
        }
        const idx_semicolon = src.indexOf(";", idx_end_multicomment);
        const idx_semiparen = src.indexOf("{", idx_end_multicomment);

        const idx_end = idx_semicolon > idx_semiparen ? idx_semicolon : idx_semiparen;
        const idx_start = src.lastIndexOf("*/", idx_end) + 2;

        src = src.slice(0, idx_start) + "\n" + src.slice(idx_start, idx_end).replaceAll(/[ ]+/g, " ").replaceAll("\n", "") + src.slice(idx_end);
        _index = idx_end;
      }
    }
    //* flat base on paren
    {
      let _index = 0;
      while (true) {
        const start_paren = src.indexOf("(", _index);
        if (start_paren === -1) {
          break;
        }
        const end_paren = src.indexOf(")", start_paren);

        //console.log(`${start_paren} : ${end_paren}`);
        src = src.slice(0, start_paren) + src.slice(start_paren, end_paren).replaceAll(/[ ]+/g, " ").replaceAll("\n", "") + src.slice(end_paren);
        const end_paren_re = src.indexOf(")", start_paren);
        _index = end_paren_re;
      }
    }
    //* flat cenum
    {
      let _index = 0;
      while (true) {
        const idx_cenum = src.indexOf("cenum", _index);
        if (idx_cenum === -1) {
          break;
        }
        const idx_end_semiparen = src.indexOf("}", idx_cenum);
        const idx_start = idx_cenum;
        const idx_end = idx_end_semiparen;
        //console.log(`${start_paren} : ${end_paren}`);
        src = src.slice(0, idx_start) + src.slice(idx_start, idx_end).replaceAll(/[ ]+/g, " ").replaceAll("\n", "") + src.slice(idx_end);
        const idx_end_re = src.indexOf(")", idx_start);
        _index = idx_end_re;
      }
    }
  }

  const fd = fs.openSync("dst.d.ts", "w");

  fs.writeSync(fd, Buffer.from(src, "utf-8"));
  return src;
}
