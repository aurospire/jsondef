import { NullField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class NullFieldBuilder<Optional extends boolean = false> extends BaseFieldBuilder<'null', Optional> implements NullField {
    constructor(from?: NullFieldBuilder<Optional>) { super(from); }

    get kind(): "null" { return 'null'; }

    clone() { return new NullFieldBuilder(this); }
}
