import { RecordSchema, SizedAttributes } from "../Schema";
import { SizedSchemaBuilder } from "./SizedSchemaBuilder";

/**
 * Builder class for creating record schemas.
 * @template Of - The type of schema for the record values.
 * @template Optional - Whether the record schema is optional or not.
 */
export class RecordSchemaBuilder<const Of extends RecordSchema['of'], const Optional extends boolean = false>
    extends SizedSchemaBuilder<'record', Optional>
    implements RecordSchema {

    #of: Of;

    #key: RecordSchema['key'];

    /**
     * Creates a new RecordSchemaBuilder instance.
     * @param from - Either a RecordSchemaBuilder to copy from or a Schema for the record values.
     */
    constructor(from: RecordSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof RecordSchemaBuilder ? from : undefined);

        this.#of = from instanceof RecordSchemaBuilder ? from.#of : from;

        this.#key = from instanceof RecordSchemaBuilder ? from.#key : undefined;
    }

    /** Gets the kind of schema (always 'record' for RecordSchemaBuilder) */
    get kind(): "record" { return 'record'; }

    /** Gets the schema of the record values */
    get of(): Of { return this.#of; }

    /** Gets the schema of the record keys */
    get key() { return this.#key; }

    /**
     * Sets the schema for the record keys.
     * @param key - The schema to use for record keys.
     * @returns A new RecordSchemaBuilder instance with the updated key schema.
     */
    by(key?: RecordSchema['key']): RecordSchemaBuilder<Of, Optional> {
        const builder = this.clone();

        builder.#key = key;

        return builder;
    }

    /**
     * Makes the record schema optional.
     * @returns A new RecordSchemaBuilder instance with isOptional set to true.
     */
    override optional(): RecordSchemaBuilder<Of, true> { return super.optional() as any; }

    /**
     * Makes the record schema required.
     * @returns A new RecordSchemaBuilder instance with isOptional set to false.
     */
    override required(): RecordSchemaBuilder<Of, false> { return super.required() as any; }

    /**
     * Sets the size constraints for the record schema.
     * @param size - The size constraints to set.
     * @returns A new RecordSchemaBuilder instance with the updated size constraints.
     */
    override size(size: SizedAttributes): RecordSchemaBuilder<Of, Optional> { return super.size(size) as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of RecordSchemaBuilder with the same attributes, value schema, and key schema.
     */
    protected override clone() { return new RecordSchemaBuilder<Of, Optional>(this); }
}