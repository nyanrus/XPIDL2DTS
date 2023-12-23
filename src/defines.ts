/**
 * XPIDL Attribute that like [A,B,...,C]
 */
export class Attribute {
  values: string[];
  private constructor(values: string[]) {
    this.values = values;
  }
  /**
   * Make line to Attribute
   * @param line line that including XPIDL Attribute
   * @returns separated Attribute and later string
   */
  static fromLine(line: string): [Attribute, string] {
    const arr = line
      .slice(1, line.indexOf("]"))
      .split(",")
      .map((v) => {
        return v.trim();
      });

    //console.log(_out);
    const _out = line.slice(line.indexOf("]") + 1);
    const attribute = new Attribute(arr);
    //console.log(`ATTRIBUTE: ${attribute.values}`);
    return [attribute, _out.trimStart()];
  }
  /**
   * Attribute to string
   * @returns stringifyed Attribute
   */
  toLine(): string {
    return `[${this.values.join(", ")}]`;
  }
}
