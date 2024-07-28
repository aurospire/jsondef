import { RootSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class RootSchemaBuilder<const Optional extends boolean = false>
    extends BaseSchemaBuilder<'root', Optional>
    implements RootSchema {

    constructor(from?: RootSchemaBuilder<Optional>) { super(from); }

    get kind(): "root" { return 'root'; }

    override optional(): RootSchemaBuilder<true> { return super.optional() as any; }

    override required(): RootSchemaBuilder<false> { return super.required() as any; }


    protected override clone() { return new RootSchemaBuilder(this); }
}
