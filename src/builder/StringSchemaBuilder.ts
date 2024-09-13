import { BoundedAttributes, StringAttributes, StringSchema, StringFormat } from "../Schema";
import { RegexString } from "../util/RegexString";
import { SizedSchemaBuilder } from "./SizedSchemaBuilder";

/**
 * Builder class for creating string schemas.
 * @template Optional - Whether the schema is optional or not.
 */
export class StringSchemaBuilder<const Optional extends boolean = false>
    extends SizedSchemaBuilder<'string', Optional>
    implements StringSchema {

    #of: StringAttributes['of'];

    /**
     * Creates a new StringSchemaBuilder instance.
     * @param from - Optional StringSchemaBuilder to copy attributes from.
     */
    constructor(from?: StringSchemaBuilder<Optional>) {
        super(from);

        this.#of = from ? from.#of : undefined;
    }

    /** Gets the kind of schema */
    override get kind(): "string" { return 'string'; }

    /** Gets the string format or pattern */
    get of() { return this.#of; }

    /**
     * Sets the pattern or format for the string schema.
     * @param pattern - The pattern or format to set.
     * @returns A new builder instance with the updated pattern.
     */
    pattern(pattern?: StringSchema['of']): StringSchemaBuilder<Optional> {
        const builder = this.clone();

        builder.#of = pattern;

        return builder;
    }

    /** Sets the string format to 'date' */
    date(): StringSchemaBuilder<Optional> { return this.pattern('date'); }

    /** Sets the string format to 'time' */
    time(): StringSchemaBuilder<Optional> { return this.pattern('time'); }

    /** Sets the string format to 'datetime' */
    datetime(): StringSchemaBuilder<Optional> { return this.pattern('datetime'); }

    /** Sets the string format to 'uuid' */
    uuid(): StringSchemaBuilder<Optional> { return this.pattern('uuid'); }

    /** Sets the string format to 'base64' */
    base64(): StringSchemaBuilder<Optional> { return this.pattern('base64'); }

    /** Sets the string format to 'email' */
    email(): StringSchemaBuilder<Optional> { return this.pattern('email'); }

    /**
     * Sets a custom regex pattern for the string schema.
     * @param pattern - The regex pattern to set.
     * @returns A new builder instance with the updated regex pattern.
     */
    regex(pattern: RegExp | RegexString): StringSchemaBuilder<Optional> { return this.pattern(pattern); }

    /** Makes the schema optional */
    override optional(): StringSchemaBuilder<true> { return super.optional() as any; }

    /** Makes the schema required */
    override required(): StringSchemaBuilder<false> { return super.required() as any; }

    /**
     * Sets the size constraints for the string schema.
     * @param size - The size constraints to set.
     * @returns A new builder instance with the updated size constraints.
     */
    override size(size: BoundedAttributes): StringSchemaBuilder<Optional> { return super.size(size) as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new instance of the builder with the same attributes and pattern.
     */
    protected override clone() { return new StringSchemaBuilder<Optional>(this); }
}