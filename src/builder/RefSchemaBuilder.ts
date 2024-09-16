import { RefSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating reference schemas.
 * @template Of - The type of the reference schema's target.
 * @template Optional - Whether the schema is optional or not.
 */
export class RefSchemaBuilder<const Of extends RefSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'ref', Optional>
    implements RefSchema {

    /** Private field to store the reference schema's target */
    #of: Of;

    /**
     * Creates a new RefSchemaBuilder instance.
     * @param from - Either an existing RefSchemaBuilder to copy from, or the reference schema's target.
     */
    constructor(from: RefSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof RefSchemaBuilder ? from : undefined);

        this.#of = from instanceof RefSchemaBuilder ? from.#of : from;
    }

    /** Gets the kind of schema */
    get kind(): "ref" { return 'ref'; }

    /** Gets the reference schema's target */
    get of(): Of { return this.#of; }

    /**
     * Makes the schema optional.
     * @returns A new RefSchemaBuilder instance with isOptional set to true.
     */
    override optional(): RefSchemaBuilder<Of, true> { return super.optional() as any; }

    /**
     * Makes the schema required.
     * @returns A new RefSchemaBuilder instance with isOptional set to false.
     */
    override required(): RefSchemaBuilder<Of, false> { return super.required() as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new RefSchemaBuilder instance with the same properties.
     */
    protected override clone() { return new RefSchemaBuilder<Of, Optional>(this); }
}