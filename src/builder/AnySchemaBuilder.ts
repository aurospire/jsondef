import { AnySchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class AnySchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'any', Optional>
    implements AnySchema {

    constructor(from?: AnySchemaBuilder<Optional>) { super(from); }

    get kind(): "any" { return 'any'; }


    override optional(): AnySchemaBuilder<true> { return super.optional() as any; }

    override required(): AnySchemaBuilder<false> { return super.required() as any; }


    protected override clone() { return new AnySchemaBuilder<Optional>(this); }
}
