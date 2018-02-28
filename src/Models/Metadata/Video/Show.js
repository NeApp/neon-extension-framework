import {MediaTypes} from 'neon-extension-framework/Core/Enums';

import Item, {Common, Metadata} from '../Core/Base';


export class ShowCommon extends Common {
    static Schema = {
        ...Common.Schema,

        title: new Item.Properties.Text({
            change: false,
            identifier: true
        })

        // TODO year?
    };
}

export class ShowMetadata extends Metadata {
    static Schema = {
        ...Metadata.Schema,
        ...ShowCommon.Schema
    };

    get title() {
        return this.get('title');
    }

    set title(value) {
        this.set('title', value);
    }
}

export default class Show extends Item {
    static Metadata = ShowMetadata;
    static Type = MediaTypes.Video.Show;

    static Schema = {
        ...Item.Schema,
        ...ShowCommon.Schema
    };

    get title() {
        return this.get('title');
    }

    set title(value) {
        this.set('title', value);
    }
}