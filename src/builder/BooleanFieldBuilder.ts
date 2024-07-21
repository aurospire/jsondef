import { BooleanField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class BooleanFieldBuilder<Optional extends boolean = false> extends BaseFieldBuilder<'boolean', Optional> implements BooleanField {
    constructor(from?: BooleanFieldBuilder<Optional>) { super(from); }

    get kind(): "boolean" { return 'boolean'; }

    clone() { return new BooleanFieldBuilder(this); }
}
