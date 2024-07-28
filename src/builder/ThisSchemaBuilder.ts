import { ThisSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class ThisSchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'this', Optional>
    implements ThisSchema {

    constructor(from?: ThisSchemaBuilder<Optional>) { super(from); }

    get kind(): "this" { return 'this'; }

    override optional(): ThisSchemaBuilder<true> { return super.optional() as any; }

    override required(): ThisSchemaBuilder<false> { return super.required() as any; }


    protected override clone() { return new ThisSchemaBuilder(this); }
}
