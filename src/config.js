const baseUrls = {
	development: 'http://localhost:3030/',
	staging: 'http://104.131.34.211/',
	production: 'http://www.product-video-feeds.com/'
};

const config = {
    development: {
    	baseUrl: baseUrls['development'],
        db: 'mongodb://localhost/sample_api', // -> host/database_name[/port][/options]
        session_secret: '1wEEnAh11',
        redis: {},
        oauth: {
			sharedSecret: '7969310b79a5e99b21349e2097a5ff40',
			redirectUri: baseUrls['development']+'auth/grant',
			apiKey: 'db7c687e9e9afbed4cffb118951c7f29',
			scopes: ['write_content', 'write_themes', 'write_products', 'write_script_tags', 'write_customers', 'write_orders']
		},
		billing: {
			"name": "Test Charge",
			"return_url": baseUrls['development'],
			"price": 15.0,
			"trial_days": 7,
			"test": true
		}
    },

    staging: {
    	baseUrl: baseUrls['staging'],
        db: 'mongodb://localhost/sample_api', // -> host/database_name[/port][/options]
        session_secret: '1wEEnAh11',
        redis: {},
        oauth: {
			sharedSecret: '7969310b79a5e99b21349e2097a5ff40',
			redirectUri: baseUrls['staging']+'auth/grant',
			apiKey: 'db7c687e9e9afbed4cffb118951c7f29',
			scopes: ['read_products', 'write_products', 'read_script_tags', 'write_script_tags', 'read_themes', 'write_themes']
		},
		billing: {
			"name": "Test Charge",
			"return_url": baseUrls['staging']+"billing/complete",
			"price": 15.0,
			"trial_days": 7,
			"test": true
		}
    },

    production: {
    	baseUrl: baseUrls['production'],
        db: 'mongodb://localhost/sample_api', // -> host/database_name[/port][/options]
        session_secret: '1wEEnAh11',
        redis: {},
        oauth: {
			sharedSecret: '7969310b79a5e99b21349e2097a5ff40',
			redirectUri: baseUrls['production']+'auth/grant',
			apiKey: 'db7c687e9e9afbed4cffb118951c7f29',
			scopes: ['read_products', 'write_products', 'read_script_tags', 'write_script_tags', 'read_themes', 'write_themes']
		},
		billing: {
			"name": "Test Charge",
			"return_url": baseUrls['production']+"billing/complete",
			"price": 15.0,
			"trial_days": 7,
			"test": true
		}
    }
};

export default config;
