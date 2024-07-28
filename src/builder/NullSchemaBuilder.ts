import { NullSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class NullSchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'null', Optional>
    implements NullSchema {

    constructor(from?: NullSchemaBuilder<Optional>) { super(from); }

    get kind(): "null" { return 'null'; }


    override optional(): NullSchemaBuilder<true> { return super.optional() as any; }

    override required(): NullSchemaBuilder<false> { return super.required() as any; }


    protected override clone() { return new NullSchemaBuilder<Optional>(this); }
}
