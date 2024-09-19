import { LiteralSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating literal schemas.
 * @template Of - The type of the literal value (boolean | number | string).
 * @template Optional - Whether the schema is optional or not.
 */
export class LiteralSchemaBuilder<const Of extends LiteralSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'literal', Optional>
    implements LiteralSchema {

    /** The literal value that the schema represents */
    #of: Of;

    /**
     * Creates a new LiteralSchemaBuilder instance.
     * @param from - Either a LiteralSchemaBuilder to copy from or the literal value to represent.
     * @throws {Error} If the literal value is NaN or not finite (for number literals).
     */
    constructor(from: LiteralSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof LiteralSchemaBuilder ? from : undefined);

        if (typeof from === 'number' && (Number.isNaN(from) || !Number.isFinite(from)))
            throw new Error(`LiteralSchema cannot be ${from}`);

        this.#of = from instanceof LiteralSchemaBuilder ? from.#of : from;
    }

    /** Gets the kind of schema */
    override get kind(): "literal" { return 'literal'; }

    /** Gets the literal value that the schema represents */
    get of() { return this.#of; }

    /**
     * Makes the schema optional.
     * @returns A new LiteralSchemaBuilder instance with isOptional set to true.
     */
    override optional(): LiteralSchemaBuilder<Of, true> { return super.optional() as any; }

    /**
     * Makes the schema required.
     * @returns A new LiteralSchemaBuilder instance with isOptional set to false.
     */
    override required(): LiteralSchemaBuilder<Of, false> { return super.required() as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of LiteralSchemaBuilder with the same attributes.
     */
    protected override clone(): LiteralSchemaBuilder<Of, Optional> { return new LiteralSchemaBuilder<Of, Optional>(this); }
}