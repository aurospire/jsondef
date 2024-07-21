import { RootField } from "../Field";
import { BaseFieldBuilder } from "./BaseFieldBuilder";

export class RootFieldBuilder<Optional extends boolean> extends BaseFieldBuilder<'root', Optional> implements RootField {
    constructor(from?: RootFieldBuilder<Optional>) { super(from); }

    get kind(): "root" { return 'root'; }

    clone() { return new RootFieldBuilder(this); }
}
