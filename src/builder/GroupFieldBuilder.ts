import { GroupField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class GroupFieldBuilder<
    const Of extends GroupField['of'],
    const Selected extends string | undefined = undefined,
    const Optional extends boolean = false
>
    extends BaseFieldBuilder<'group', Optional>
    implements GroupField {

    #of: Of;

    #selected: Selected;


    constructor(from: GroupFieldBuilder<Of, Selected, Optional> | Of) {
        super(from instanceof GroupFieldBuilder ? from : undefined);

        this.#of = from instanceof GroupFieldBuilder ? from.#of : from;

        this.#selected = from instanceof GroupFieldBuilder ? from.#selected : undefined as any;
    }

    get kind(): "group" { return 'group'; }

    get of(): Of { return this.#of; }

    get selected(): Selected { return this.#selected; }


    select<Key extends (string & keyof Of) | undefined>(key: Key): GroupFieldBuilder<Of, Key, Optional> {
        const builder = this.clone();

        this.#selected = key as any;

        return builder as any;
    }


    override optional(): GroupFieldBuilder<Of, Selected, true> { return super.optional() as any; }

    override required(): GroupFieldBuilder<Of, Selected, false> { return super.required() as any; }

    protected override clone() { return new GroupFieldBuilder<Of, Selected, Optional>(this); }
}