import { RootField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class RootFieldBuilder<const Optional extends boolean = false>
    extends BaseFieldBuilder<'root', Optional>
    implements RootField {

    constructor(from?: RootFieldBuilder<Optional>) { super(from); }

    get kind(): "root" { return 'root'; }

    override optional(): RootFieldBuilder<true> { return super.optional() as any; }

    override required(): RootFieldBuilder<false> { return super.required() as any; }


    protected override clone() { return new RootFieldBuilder(this); }
}
