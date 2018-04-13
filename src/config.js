const baseUrls = {
	development: 'http://dev.pcoleman.com:3030/',
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
			sharedSecret: '448da957fc13be7e8c761fe0df3a5579',
			redirectUri: baseUrls['development']+'auth/grant',
			apiKey: '8e9391b0646a2bfed9a9af2f810d3cd5',
			scopes: ['write_content', 'write_themes', 'write_products', 'write_script_tags', 'read_customers', 'write_customers', 'write_orders']
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
			sharedSecret: '448da957fc13be7e8c761fe0df3a5579',
			redirectUri: baseUrls['staging']+'auth/grant',
			apiKey: '8e9391b0646a2bfed9a9af2f810d3cd5',
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
			sharedSecret: '448da957fc13be7e8c761fe0df3a5579',
			redirectUri: baseUrls['production']+'auth/grant',
			apiKey: '8e9391b0646a2bfed9a9af2f810d3cd5',
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
