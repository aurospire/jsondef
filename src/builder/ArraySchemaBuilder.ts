import { ArraySchema, BoundedAttributes, Schema } from "../Schema";
import { PositiveBoundedSchemaBuilder } from "./PositiveBoundedSchemaBuilder";

export class ArraySchemaBuilder<const Of extends Schema, const Optional extends boolean = false>
    extends PositiveBoundedSchemaBuilder<'array', Optional>
    implements ArraySchema {

    #of: Of;

    constructor(from: ArraySchemaBuilder<Of, Optional> | Of) {
        super(from instanceof ArraySchemaBuilder ? from : undefined);

        this.#of = from instanceof ArraySchemaBuilder ? from.#of : from;
    }

    override get kind(): "array" { return 'array'; }

    get of() { return this.#of; }


    override optional(): ArraySchemaBuilder<Of, true> { return super.optional() as any; }

    override required(): ArraySchemaBuilder<Of, false> { return super.required() as any; }

    override bound(bounds: BoundedAttributes): ArraySchemaBuilder<Of, Optional> { return super.bound(bounds) as any; }


    protected override clone() { return new ArraySchemaBuilder<Of, Optional>(this); }
}
