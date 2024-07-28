import { ThisField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class ThisFieldBuilder<const Optional extends boolean = false>
    extends BaseFieldBuilder<'this', Optional>
    implements ThisField {

    constructor(from?: ThisFieldBuilder<Optional>) { super(from); }

    get kind(): "this" { return 'this'; }

    override optional(): ThisFieldBuilder<true> { return super.optional() as any; }

    override required(): ThisFieldBuilder<false> { return super.required() as any; }


    protected override clone() { return new ThisFieldBuilder(this); }
}
