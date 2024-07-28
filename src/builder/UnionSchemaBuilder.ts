import { UnionSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class UnionSchemaBuilder<const Of extends UnionSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'union', Optional>
    implements UnionSchema {

    #of: Of;

    constructor(from: UnionSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof UnionSchemaBuilder ? from : undefined);

        this.#of = from instanceof UnionSchemaBuilder ? from.#of : from;
    }

    get kind(): "union" { return 'union'; }

    get of(): Of { return this.#of; }

    override optional(): UnionSchemaBuilder<Of, true> { return super.optional() as any; }

    override required(): UnionSchemaBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new UnionSchemaBuilder<Of, Optional>(this); }
}