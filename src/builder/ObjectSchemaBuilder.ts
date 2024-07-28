import { ObjectSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class ObjectSchemaBuilder<const Of extends ObjectSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'object', Optional>
    implements ObjectSchema {

    #of: Of;

    constructor(from: ObjectSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof ObjectSchemaBuilder ? from : undefined);

        this.#of = from instanceof ObjectSchemaBuilder ? from.#of : from;
    }

    get kind(): "object" { return 'object'; }

    get of(): Of { return this.#of; }

    override optional(): ObjectSchemaBuilder<Of, true> { return super.optional() as any; }

    override required(): ObjectSchemaBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new ObjectSchemaBuilder<Of, Optional>(this); }
}