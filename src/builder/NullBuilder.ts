import { FieldBuilder } from "./FieldBuilder";

export class NullBuilder<Optional extends boolean> extends FieldBuilder<'null', Optional> {
    constructor(from?: NullBuilder<Optional>) {
        super(from);
    }

    get kind(): "null" {
        return 'null';
    }

    clone() {
        return new NullBuilder(this);
    }
}

export class AnyBuilder<Optional extends boolean> extends FieldBuilder<'any', Optional> {
    constructor(from?: AnyBuilder<Optional>) {
        super(from);
    }

    get kind(): "any" {
        return 'any';
    }

    clone() {
        return new AnyBuilder(this);
    }
}

export class BooleanBuilder<Optional extends boolean> extends FieldBuilder<'boolean', Optional> {
    constructor(from?: BooleanBuilder<Optional>) {
        super(from);
    }

    get kind(): "boolean" {
        return 'boolean';
    }

    clone() {
        return new BooleanBuilder(this);
    }
}

export class ThisBuilder<Optional extends boolean> extends FieldBuilder<'this', Optional> {
    constructor(from?: ThisBuilder<Optional>) {
        super(from);
    }

    get kind(): "this" {
        return 'this';
    }

    clone() {
        return new ThisBuilder(this);
    }
}

export class RootBuilder<Optional extends boolean> extends FieldBuilder<'root', Optional> {
    constructor(from?: RootBuilder<Optional>) {
        super(from);
    }

    get kind(): "root" {
        return 'root';
    }

    clone() {
        return new RootBuilder(this);
    }
}
