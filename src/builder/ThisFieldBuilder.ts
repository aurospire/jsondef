import { ThisField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class ThisFieldBuilder<Optional extends boolean = false> extends BaseFieldBuilder<'this', Optional> implements ThisField {
    constructor(from?: ThisFieldBuilder<Optional>) { super(from); }

    get kind(): "this" { return 'this'; }

    clone() { return new ThisFieldBuilder(this); }
}
