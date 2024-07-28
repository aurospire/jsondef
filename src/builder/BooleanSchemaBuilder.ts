import { BooleanSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class BooleanSchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'boolean', Optional>
    implements BooleanSchema {

    constructor(from?: BooleanSchemaBuilder<Optional>) { super(from); }

    get kind(): "boolean" { return 'boolean'; }

    override optional(): BooleanSchemaBuilder<true> { return super.optional() as any; }

    override required(): BooleanSchemaBuilder<false> { return super.required() as any; }


    protected override clone() { return new BooleanSchemaBuilder(this); }
}
