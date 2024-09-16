import { TupleSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating tuple schemas.
 * @template Of - The type of the tuple elements.
 * @template Rest - The type of the rest elements (if any).
 * @template Optional - Whether the schema is optional or not.
 */
export class TupleSchemaBuilder<
    const Of extends TupleSchema['of'],
    const Rest extends TupleSchema['rest'] = undefined,
    Optional extends boolean = false
>
    extends BaseSchemaBuilder<'tuple', Optional>
    implements TupleSchema {

    /** The schemas of the elements in the tuple */
    #of: Of;

    /** The schema for additional elements beyond the fixed tuple */
    #rest: Rest;

    /**
     * Creates a new TupleSchemaBuilder instance.
     * @param from - Either a TupleSchemaBuilder to copy from or the 'of' array.
     * @param rest - Optional schema for additional elements.
     */
    constructor(from: TupleSchemaBuilder<Of, Rest, Optional> | Of, rest?: Rest) {
        super(from instanceof TupleSchemaBuilder ? from : undefined);

        this.#of = from instanceof TupleSchemaBuilder ? from.#of : from;

        this.#rest = from instanceof TupleSchemaBuilder ? from.#rest : rest as Rest;
    }

    /** Gets the kind of schema */
    get kind(): "tuple" { return 'tuple'; }

    /** Gets the schemas of the elements in the tuple */
    get of(): Of { return this.#of; }

    /** Gets the schema for additional elements beyond the fixed tuple */
    get rest(): Rest { return this.#rest; }

    /**
     * Makes the schema optional.
     * @returns A new builder instance with isOptional set to true.
     */
    override optional(): TupleSchemaBuilder<Of, Rest, true> { return super.optional() as any; }

    /**
     * Makes the schema required.
     * @returns A new builder instance with isOptional set to false.
     */
    override required(): TupleSchemaBuilder<Of, Rest, false> { return super.required() as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of the builder with the same attributes.
     */
    protected override clone() { return new TupleSchemaBuilder<Of, Rest, Optional>(this); }
}