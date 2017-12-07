import ForEach from 'lodash-es/forEach';
import IsEqual from 'lodash-es/isEqual';
import IsNil from 'lodash-es/isNil';
import IsPlainObject from 'lodash-es/isPlainObject';
import IsString from 'lodash-es/isString';
import MapKeys from 'lodash-es/mapKeys';
import MapValues from 'lodash-es/mapValues';
import Merge from 'lodash-es/merge';
import Omit from 'lodash-es/omit';
import Pick from 'lodash-es/pick';
import PickBy from 'lodash-es/pickBy';
import Slugify from 'slugify';

import Model from 'neon-extension-framework/models/core/base';


export default class Item extends Model {
    static type = null;

    static children = {};

    static itemProperties = [
        'id',
        'revision',

        'createdAt',
        'updatedAt'
    ];

    static metadata = [
        'title'
    ];

    constructor(values, children) {
        super();

        values = values || {};

        this.id = values.id || null;
        this.revision = values.revision || null;

        this.values = {
            keys: {},
            title: null,

            createdAt: null,

            // Include provided values
            ...Omit(values, [
                'id',
                'revision',
                'type',

                'metadata'
            ])
        };

        this.metadata = values.metadata || {};

        this.children = children || {};
    }

    get type() {
        return this.constructor.type;
    }

    get keys() {
        return this.values.keys;
    }

    get title() {
        return this.values.title;
    }

    get createdAt() {
        return this.values.createdAt;
    }

    set createdAt(createdAt) {
        this.values.createdAt = createdAt;
    }

    get updatedAt() {
        return this.values.updatedAt;
    }

    set updatedAt(updatedAt) {
        this.values.updatedAt = updatedAt;
    }

    // region Public Methods

    createSelectors(options) {
        options = {
            keys: true,

            ...(options || {})
        };

        // Identifier selector
        if(!IsNil(this.id)) {
            return [{
                '_id': this.id
            }];
        }

        if(!options.keys) {
            throw new Error('No identifier has been defined');
        }

        // Create base selector
        let base = {
            type: this.type
        };

        ForEach(this.children, (child, name) => {
            if(IsNil(child)) {
                throw new Error('No "' + name + '" has been defined');
            }

            let selectors;

            try {
                selectors = child.createSelectors({ keys: false });
            } catch(e) {
                throw new Error('Unable to create "' + name + '" selectors: ' + (e && e.message ? e.message : e));
            }

            ForEach(selectors, (selectors) => {
                if(selectors.length > 1) {
                    throw new Error('"' + name + '" returned more than one selector');
                }

                ForEach(selectors[0], (value, key) => {
                    base[name + '.' + key] = value;
                });
            });
        });

        // Create key selectors
        return this._createKeySelectors(base, this.keys);
    }

    get(source) {
        return {
            ...Pick(this.values, this.constructor.metadata),
            ...(this.metadata[source] || {}),

            keys: this.values.keys[source] || {}
        };
    }

    merge(current) {
        let currentDocument = current.toDocument();

        // Update (or validate) identifier
        if(IsNil(this.id)) {
            this.id = current.id;
        } else if(!IsNil(current.id) && this.id !== current.id) {
            throw new Error('Item id mismatch');
        }

        // Update revision
        if(IsNil(this.revision)) {
            this.revision = current.revision;
        } else if(!IsNil(current.revision) && this.revision !== current.revision) {
            throw new Error('Item revision mismatch');
        }

        // Merge values
        this.values = {
            ...(current.values || {}),
            ...(this.values || {}),

            // Merge keys
            keys: Merge(
                this.values.keys || {},
                current.values.keys || {}
            ),

            // Override values
            title: current.title || this.title,

            createdAt: current.createdAt || this.createdAt
        };

        // TODO Merge children

        // Merge metadata
        ForEach(Object.keys(current.metadata), (source) => {
            this.metadata[source] = {
                ...Pick(current.values, this.constructor.metadata),
                ...current.metadata[source],

                ...Pick(this.values, this.constructor.metadata),
                ...(this.metadata[source] || {})
            };
        });

        // Check for changes
        return !IsEqual(currentDocument, this.toDocument());
    }

    update(source, values) {
        if(IsNil(values)) {
            return this;
        }

        // Set local metadata properties (if not already defined)
        ForEach(Object.keys(this.values), (key) => {
            if(IsNil(this.values[key]) && !IsNil(values[key])) {
                this.values[key] = values[key];
            }
        });

        // Update keys
        this.values.keys['item'] = {
            ...(this.values.keys['item'] || {}),

            slug: !IsNil(this.title) ? Slugify(this.title, {
                lower: true,
                remove: /[$*_+~.()'"!\-:@]/g
            }) : null
        };

        // Update source keys
        this.values.keys[source] = {
            ...(this.values.keys[source] || {}),
            ...(values.keys || {})
        };

        // Update source metadata
        this.metadata[source] = {
            ...(this.metadata[source] || {}),
            ...Omit(values, ['keys'])
        };

        return this;
    }

    toDocument() {
        let doc = PickBy(this.values, (value) => !IsNil(value));

        // Build metadata
        let metadata = PickBy(
            MapValues(this.metadata, (metadata) => PickBy(
                PickBy(metadata, (value, key) => {
                    if(key === 'keys') {
                        return false;
                    }

                    if(this.constructor.metadata.indexOf(key) < 0) {
                        return true;
                    }

                    return !IsEqual(doc[key], value);
                })
            )),
            (metadata) => Object.keys(metadata).length > 0
        );

        if(Object.keys(metadata).length > 0) {
            doc.metadata = metadata;
        }

        // Include optional values
        if(!IsNil(this.id)) {
            doc['_id'] = this.id;
        }

        if(!IsNil(this.revision)) {
            doc['_rev'] = this.revision;
        }

        if(!IsNil(this.constructor.type)) {
            doc['type'] = this.constructor.type;
        }

        return doc;
    }

    // endregion

    // region Private Methods

    _createKeySelectors(base, keys, prefix, selectors) {
        if(IsNil(prefix)) {
            prefix = 'keys';
        }

        if(IsNil(selectors)) {
            selectors = [];
        }

        for(let source in keys) {
            if(!keys.hasOwnProperty(source) || IsNil(keys[source])) {
                continue;
            }

            if(IsPlainObject(keys[source])) {
                this._createKeySelectors(base, keys[source], prefix + '.' + source, selectors);
                continue;
            }

            // Create selector
            let selector = {
                ...base
            };

            selector[prefix + '.' + source] = keys[source];

            // Add selector to OR clause
            selectors.push(selector);
        }

        return selectors;
    }

    // endregion

    // region Static Methods

    static create(source, values, children) {
        if(!IsString(source)) {
            throw new Error('Invalid value provided for the "source" parameter (expected string)');
        }

        // Create item
        let item = (new this(
            Pick(values, this.itemProperties),
            children
        ));

        // Update item with source metadata
        return item.update(
            source,
            Omit(values, this.itemProperties)
        );
    }

    static decode(values, options) {
        values = MapKeys(values, (value, key) => {
            if(key === '_id') {
                return 'id';
            }

            if(key === '_rev') {
                return 'revision';
            }

            return key;
        });

        // Create item
        return (new this(values, {}));
    }

    // endregion
}
