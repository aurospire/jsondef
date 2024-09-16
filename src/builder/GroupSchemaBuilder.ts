import { GroupSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

/**
 * Builder class for creating group schemas.
 * @template Of - The type of the group schema's properties.
 * @template Selected - The type of the selected property key.
 * @template Optional - Whether the schema is optional or not.
 */
export class GroupSchemaBuilder<
    const Of extends GroupSchema['of'],
    const Selected extends string | undefined = undefined,
    const Optional extends boolean = false
>
    extends BaseSchemaBuilder<'group', Optional>
    implements GroupSchema {

    /** Private field to store the group schema properties */
    #of: Of;

    /** Private field to store the selected property key */
    #selected: Selected;

    /**
     * Creates a new GroupSchemaBuilder instance.
     * @param from - Either an existing GroupSchemaBuilder to copy from, or the group schema properties.
     */
    constructor(from: GroupSchemaBuilder<Of, Selected, Optional> | Of) {
        super(from instanceof GroupSchemaBuilder ? from : undefined);

        this.#of = from instanceof GroupSchemaBuilder ? from.#of : from;

        this.#selected = from instanceof GroupSchemaBuilder ? from.#selected : undefined as any;
    }

    /** Gets the kind of schema */
    get kind(): "group" { return 'group'; }

    /** Gets the group schema properties */
    get of(): Of { return this.#of; }

    /** Gets the selected property key */
    get selected(): Selected { return this.#selected; }

    /**
     * Selects a property key from the group schema.
     * @param key - The key to select.
     * @returns A new GroupSchemaBuilder instance with the selected key.
     */
    select<Key extends (string & keyof Of) | undefined>(key: Key): GroupSchemaBuilder<Of, Key, Optional> {
        const builder = this.clone();

        builder.#selected = key as any;

        return builder as any;
    }

    /**
     * Makes the schema optional.
     * @returns A new GroupSchemaBuilder instance with isOptional set to true.
     */
    override optional(): GroupSchemaBuilder<Of, Selected, true> { return super.optional() as any; }

    /**
     * Makes the schema required.
     * @returns A new GroupSchemaBuilder instance with isOptional set to false.
     */
    override required(): GroupSchemaBuilder<Of, Selected, false> { return super.required() as any; }

    /**
     * Creates a clone of the current builder.
     * @returns A new GroupSchemaBuilder instance with the same properties.
     */
    protected override clone() { return new GroupSchemaBuilder<Of, Selected, Optional>(this); }
}