import { RefSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class RefSchemaBuilder<const Of extends RefSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'ref', Optional>
    implements RefSchema {

    #of: Of;

    constructor(from: RefSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof RefSchemaBuilder ? from : undefined);

        this.#of = from instanceof RefSchemaBuilder ? from.#of : from;
    }

    get kind(): "ref" { return 'ref'; }

    get of(): Of { return this.#of; }

    override optional(): RefSchemaBuilder<Of, true> { return super.optional() as any; }

    override required(): RefSchemaBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new RefSchemaBuilder<Of, Optional>(this); }
}