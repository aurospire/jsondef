import { UnionSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating union schemas.
 * @template Of - The type of the union schema's possible schemas.
 * @template Optional - Whether the schema is optional or not.
 */
export class UnionSchemaBuilder<const Of extends UnionSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'union', Optional>
    implements UnionSchema {

    /** Private field to store the union schema's possible schemas */
    #of: Of;

    /**
     * Creates a new UnionSchemaBuilder instance.
     * @param from - Either an existing UnionSchemaBuilder to copy from, or the union schema's possible schemas.
     */
    constructor(from: UnionSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof UnionSchemaBuilder ? from : undefined);

        this.#of = from instanceof UnionSchemaBuilder ? from.#of : from;
    }

    /** Gets the kind of schema */
    get kind(): "union" { return 'union'; }

    /** Gets the union schema's possible schemas */
    get of(): Of { return this.#of; }

    /**
     * Makes the schema optional.
     * @returns A new UnionSchemaBuilder instance with isOptional set to true.
     */
    override optional(): UnionSchemaBuilder<Of, true> { return super.optional() as any; }

    /**
     * Makes the schema required.
     * @returns A new UnionSchemaBuilder instance with isOptional set to false.
     */
    override required(): UnionSchemaBuilder<Of, false> { return super.required() as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new UnionSchemaBuilder instance with the same properties.
     */
    protected override clone() { return new UnionSchemaBuilder<Of, Optional>(this); }
}