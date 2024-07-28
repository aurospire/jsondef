import { GroupSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class GroupSchemaBuilder<
    const Of extends GroupSchema['of'],
    const Selected extends string | undefined = undefined,
    const Optional extends boolean = false
>
    extends BaseSchemaBuilder<'group', Optional>
    implements GroupSchema {

    #of: Of;

    #selected: Selected;


    constructor(from: GroupSchemaBuilder<Of, Selected, Optional> | Of) {
        super(from instanceof GroupSchemaBuilder ? from : undefined);

        this.#of = from instanceof GroupSchemaBuilder ? from.#of : from;

        this.#selected = from instanceof GroupSchemaBuilder ? from.#selected : undefined as any;
    }

    get kind(): "group" { return 'group'; }

    get of(): Of { return this.#of; }

    get selected(): Selected { return this.#selected; }


    select<Key extends (string & keyof Of) | undefined>(key: Key): GroupSchemaBuilder<Of, Key, Optional> {
        const builder = this.clone();

        this.#selected = key as any;

        return builder as any;
    }


    override optional(): GroupSchemaBuilder<Of, Selected, true> { return super.optional() as any; }

    override required(): GroupSchemaBuilder<Of, Selected, false> { return super.required() as any; }

    protected override clone() { return new GroupSchemaBuilder<Of, Selected, Optional>(this); }
}