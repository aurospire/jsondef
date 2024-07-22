import { BooleanField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class BooleanFieldBuilder<const Optional extends boolean = false> extends BaseFieldBuilder<'boolean', Optional> implements BooleanField {
    constructor(from?: BooleanFieldBuilder<Optional>) { super(from); }

    get kind(): "boolean" { return 'boolean'; }

    override optional(): BooleanFieldBuilder<true> { return super.optional() as any; }

    override required(): BooleanFieldBuilder<false> { return super.required() as any; }


    protected override clone() { return new BooleanFieldBuilder(this); }
}
