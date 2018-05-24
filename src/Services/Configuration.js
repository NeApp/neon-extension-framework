import {Services} from 'neon-extension-framework/Core/Constants';

import Service from './Core/Base';


export default class ConfigurationService extends Service {
    constructor(plugin, options) {
        super(plugin, 'configuration', Services.Configuration);

        this.options = options;
    }
}
