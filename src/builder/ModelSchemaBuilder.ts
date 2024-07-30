import { ModelSchema } from "../Schema";
import { BaseSchemaBuilder } from "./BaseSchemaBuilder";

export class ModelSchemaBuilder<const Of extends ModelSchema['of'], const Optional extends boolean = false>
    extends BaseSchemaBuilder<'model', Optional>
    implements ModelSchema {

    #of: Of;

    constructor(from: ModelSchemaBuilder<Of, Optional> | Of) {
        super(from instanceof ModelSchemaBuilder ? from : undefined);

        this.#of = from instanceof ModelSchemaBuilder ? from.#of : from;
    }

    get kind(): "model" { return 'model'; }

    get of(): Of { return this.#of; }


    override optional(): ModelSchemaBuilder<Of, true> { return super.optional() as any; }

    override required(): ModelSchemaBuilder<Of, false> { return super.required() as any; }

    protected override clone() { return new ModelSchemaBuilder<Of, Optional>(this); }
}
