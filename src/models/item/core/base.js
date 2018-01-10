import CloneDeep from 'lodash-es/cloneDeep';
import ForEach from 'lodash-es/forEach';
import IsNil from 'lodash-es/isNil';
import IsPlainObject from 'lodash-es/isPlainObject';
import IsString from 'lodash-es/isString';
import Map from 'lodash-es/map';
import Merge from 'lodash-es/merge';
import OmitBy from 'lodash-es/omitBy';
import Reduce from 'lodash-es/reduce';
import Without from 'lodash-es/without';

import Log from 'neon-extension-framework/core/logger';
import Model, {BaseModel} from 'neon-extension-framework/models/core/base';
import {createSlug} from 'neon-extension-framework/core/helpers/metadata';
import {product} from 'neon-extension-framework/core/helpers/value';


export class Metadata extends BaseModel {
    static Apply = {
        exclude: [
            '_id', 'id',
            '_rev', 'rev', 'revision',

            'createdAt',
            'keys',
            'metadata',
            'type'
        ],

        unknown: true
    };

    static Copy = {
        unknown: true
    };

    static Extract = {
        unknown: true
    };

    static Schema = {
        updatedAt: new Model.Properties.Integer({
            deferred: true
        })
    };

    constructor(parent, source) {
        super();

        this._parent = parent;
        this._source = source;
    }

    get parent() {
        return this._parent;
    }

    get source() {
        return this._source;
    }

    get values() {
        return this.parent.metadata[this.source];
    }

    get keys() {
        return this._parent.get('keys')[this.source];
    }

    get updatedAt() {
        return this.get('updatedAt');
    }

    get(key) {
        return super.get(key) || this._parent.get(key);
    }
}

export default class Item extends Model {
    static Metadata = Metadata;
    static Type = null;

    static Schema = {
        ...Model.Schema,

        keys: new Model.Properties.Index({
            identifier: true
        }),

        // Timestamps
        createdAt: new Model.Properties.Integer({
            change: false
        })
    };

    constructor(values, metadata) {
        super(values);

        this._metadata = metadata || {};
    }

    get metadata() {
        return this._metadata;
    }

    get type() {
        return this.constructor.Type;
    }

    get keys() {
        return this.get('keys');
    }

    get slug() {
        if(IsNil(this.keys['item'])) {
            return null;
        }

        return this.keys['item']['slug'] || null;
    }

    get createdAt() {
        return this.get('createdAt');
    }

    get updatedAt() {
        return this.get('updatedAt');
    }

    apply(source, options) {
        if(IsNil(source.title)) {
            return super.apply(source, options);
        }

        return super.apply(Merge({}, source, {
            keys: {
                item: {
                    slug: createSlug(source.title)
                }
            }
        }), options);
    }

    assign(item) {
        if(!(item instanceof Model)) {
            throw new Error('Invalid value provided for the "item" parameter');
        }

        let changed = false;

        // Apply values
        changed = this.apply(item.values) || changed;

        ForEach(item.metadata, (values, name) => {
            changed = this.resolve(name).apply(values) || changed;
        });

        // Assign children
        ForEach(this.schema, (prop, key) => {
            if(!prop.reference) {
                return;
            }

            let current = prop.get(this.values, key);

            // Retrieve value
            let value = prop.get(item.values, key);

            if(IsNil(value)) {
                return;
            }

            // Update child
            if(!IsNil(current)) {
                changed = current.assign(value) || changed;
            } else {
                prop.set(this.values, key, value);
                changed = true;
            }
        });

        return changed;
    }

    createSelectors(options) {
        options = {
            prefix: null,
            includeType: true,

            ...(options || {})
        };

        // Identifier Selector
        if(!IsNil(this.id)) {
            let selector = {};

            selector[(options.prefix || '') + '_id'] = this.id;

            return [selector];
        }

        // Create base selector
        let base = {};

        if(options.includeType) {
            base[(options.prefix || '') + 'type'] = this.type;
        }

        // Create selectors
        let selectors = [Map(this._getOrderedKeys({ prefix: options.prefix }), (selector) => ({
            ...base,
            ...selector
        }))];

        ForEach(this.schema, (prop, key) => {
            if(!(prop instanceof Model.Properties.Reference)) {
                return;
            }

            let child = prop.get(this.values, key);

            if(IsNil(child)) {
                Log.debug('No "' + key + '" has been defined');
                return;
            }

            try {
                selectors.push(child.createSelectors({
                    prefix: (options.prefix || '') + key + '.',
                    includeType: false
                }));
            } catch(e) {
                Log.debug('Unable to create "' + key + '" selectors: ' + (e && e.message ? e.message : e));
            }
        });

        // Merge selectors
        return Map(product(...selectors), (selectors) =>
            Merge({}, ...selectors)
        );
    }

    inherit(item, options) {
        if(!(item instanceof Model)) {
            throw new Error('Invalid value provided for the "item" parameter');
        }

        options = {
            ...(options || {}),

            changes: {
                identifier: null,

                ...((options || {}).changes || {})
            }
        };

        let metadata = this._metadata;
        let values = this._values;

        // Replace with `item` metadata and values
        this._metadata = CloneDeep(item.metadata);
        this._values = CloneDeep(item.values);

        // Update item
        let changed = false;

        // Apply values
        changed = this.apply(this.extract(values, {
            deferred: false,
            reference: false
        }), options || {}) || changed;

        ForEach(metadata, (values, name) => {
            let source = this.resolve(name);

            let metadataChanged = source.apply(source.extract(values, {
                deferred: false,
                reference: false
            }), options || {}) || changed;

            // Apply `changes.identifier` filter
            if(!IsNil(options.changes.identifier) && options.changes.identifier === true) {
                return;
            }

            // Update `changed` value
            if(metadataChanged) {
                changed = true;
            }
        });

        // Inherit children
        ForEach(this.schema, (prop, key) => {
            if(!prop.reference) {
                return;
            }

            let current = prop.get(this.values, key);

            // Retrieve value
            let value = prop.get(values, key);

            if(IsNil(value)) {
                return;
            }

            // Update child
            if(!IsNil(current)) {
                changed = current.inherit(value, {
                    ...(options || {}),

                    changes: {
                        identifier: true
                    }
                }) || changed;
            } else {
                prop.set(this.values, key, value);
                changed = true;
            }
        });

        // Ignore deferred values (if no other changes)
        if(!changed) {
            return false;
        }

        // Apply deferred values
        this.apply(this.extract(values, {
            deferred: true,
            reference: false
        }), options || {});

        ForEach(metadata, (values, name) => {
            let source = this.resolve(name);

            source.apply(source.extract(values, {
                deferred: true,
                reference: false
            }), options || {});
        });

        return changed;
    }

    matches(other) {
        if(IsNil(other) || this.type !== other.type) {
            return false;
        }

        if(!IsNil(this.id) && this.id === other.id) {
            return true;
        }

        if(!this._matchesKeys(other.keys)) {
            return false;
        }

        if(!this._matchesChildren(other)) {
            return false;
        }

        return true;
    }

    resolve(source) {
        if(IsNil(this._metadata[source])) {
            this._metadata[source] = {};
        }

        return new this.constructor.Metadata(this, source);
    }

    toDocument() {
        let doc = {};

        // Copy item values to `document`
        this.copy(doc, { format: 'document' });

        // Copy metadata values to `document`
        let metadata = {};

        ForEach(this.metadata, (values, name) => {
            let data = {};

            // Copy source metadata values to `data`
            this.resolve(name).copy(data, { format: 'document' });

            // Omit duplicate values
            // TODO Move to a property option
            data = OmitBy(data, (value, key) => (
                key !== 'updatedAt' &&
                doc[key] === value
            ));

            // Add source metadata
            metadata[name] = data;
        });

        // Include metadata (if at least one source exists)
        if(Object.keys(metadata).length > 0) {
            doc.metadata = metadata;
        }

        // Include type (if defined)
        if(!IsNil(this.type)) {
            doc.type = this.type;
        }

        return doc;
    }

    toPlainObject() {
        let metadata = {};

        ForEach(this.metadata, (values, source) => {
            let data = {};

            // Copy source metadata values to `data`
            this.resolve(source).copy(data);

            // Add source metadata
            metadata[source] = data;
        });

        return {
            ...super.toPlainObject(),
            type: this.type,
            metadata
        };
    }

    toReference() {
        let obj = {};

        // Copy reference values to `obj`
        this.copy(obj, {
            format: 'document',
            identifier: true
        });

        return obj;
    }

    update(source, values = null) {
        if(!IsString(source)) {
            throw new Error('Invalid value provided for the "source" parameter (expected string)');
        }

        if(IsNil(values)) {
            return false;
        }

        if(!IsPlainObject(values)) {
            throw new Error('Invalid value provided for the "values" parameter (expected plain object)');
        }

        let changed = false;

        // Apply metadata values
        changed = this.resolve(source).apply(values) || changed;

        // Apply item values
        changed = this.apply({
            ...values,

            keys: this._buildSourceKeys(source, values.keys)
        }) || changed;

        return changed;
    }

    // region Static Methods

    static create(source, values = null, ...args) {
        if(!IsString(source)) {
            throw new Error('Invalid value provided for the "source" parameter (expected string)');
        }

        if(!IsNil(values) && !IsPlainObject(values)) {
            throw new Error('Invalid value provided for the "values" parameter (expected plain object)');
        }

        if(args && args.length > 0) {
            throw new Error('Only a maximum of two arguments are supported');
        }

        let now = Date.now();

        // Create `item` with source `values`
        let item = new this();

        item.update(source, {
            createdAt: now,
            updatedAt: now,

            ...(values || {})
        });

        return item;
    }

    static fromDocument(doc, options) {
        if(IsNil(doc)) {
            return null;
        }

        if(!IsPlainObject(doc)) {
            throw new Error(
                'Invalid value provided for the "doc" parameter ' +
                '(expected plain object)'
            );
        }

        if(!IsNil(this.Type) && doc.type !== this.Type) {
            throw new Error(
                'Invalid value provided for the "doc" parameter ' +
                '(expected value.type === "' + this.Type + '")'
            );
        }

        options = {
            ...options,

            format: 'document'
        };

        // Create item
        let item = new this();

        // Apply metadata values
        ForEach(doc.metadata, (values, source) => {
            item.resolve(source).apply({
                ...doc,
                ...values
            }, options);
        });

        // Apply item values
        item.apply(doc, options);

        return item;
    }

    static fromPlainObject(obj, options) {
        if(IsNil(obj)) {
            return null;
        }

        if(!IsPlainObject(obj)) {
            throw new Error(
                'Invalid value provided for the "obj" parameter ' +
                '(expected plain object)'
            );
        }

        if(!IsNil(this.Type) && obj.type !== this.Type) {
            throw new Error(
                'Invalid value provided for the "obj" parameter ' +
                '(expected value.type === "' + this.Type + '")'
            );
        }

        let item = new this();

        // Apply metadata values
        ForEach(obj.metadata, (values, source) => {
            item.resolve(source).apply(values, options);
        });

        // Apply item values
        item.apply(obj, options);

        return item;
    }

    // endregion

    // region Private Methods

    _buildSourceKeys(source, keys) {
        let result = {};

        if(IsPlainObject(keys) && Object.keys(keys).length > 0) {
            result[source] = keys || {};
        }

        return result;
    }

    _getOrderedKeys(options) {
        options = {
            prefix: null,

            ...(options || {})
        };

        // Build array of sources
        let sources = Without(Object.keys(this.keys), 'item').concat(['item']);

        // Build array of keys
        return Reduce(sources, (result, source) =>
            Reduce(this.keys[source], (result, value, name) => {
                let item = {};

                item[(options.prefix || '') + 'keys.' + source + '.' + name] = value;

                result.push(item);
                return result;
            }, result),
        []);
    }

    _matchesChildren(other) {
        for(let key in this.schema) {
            if(!this.schema.hasOwnProperty(key) || !(this.schema[key] instanceof Model.Properties.Reference)) {
                continue;
            }

            if(IsNil(this[key]) || IsNil(other[key])) {
                return false;
            }

            if(!this[key].matches(other[key])) {
                return false;
            }
        }

        return true;
    }

    _matchesKeys(keys) {
        for(let source in keys) {
            if(!keys.hasOwnProperty(source) || IsNil(this.keys[source])) {
                continue;
            }

            for(let name in keys[source]) {
                if(!keys[source].hasOwnProperty(name) || IsNil(this.keys[source][name]) || IsNil(keys[source][name])) {
                    continue;
                }

                if(this.keys[source][name] === keys[source][name]) {
                    return true;
                }
            }
        }

        return false;
    }

    // endregion
}
