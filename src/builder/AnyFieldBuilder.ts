import { AnyField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class AnyFieldBuilder<Optional extends boolean = false> extends BaseFieldBuilder<'any', Optional> implements AnyField {
    constructor(from?: AnyFieldBuilder<Optional>) { super(from); }

    get kind(): "any" { return 'any'; }

    clone() { return new AnyFieldBuilder(this); }
}
