export class Attribute {
  values: string[];
  constructor(values: string[]) {
    this.values = values;
  }
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
  toLine(): string {
    return `[${this.values.join(", ")}]`;
  }
}
