const config = {
    development: {
        db: 'mongodb://localhost/sample_api', // -> host/database_name[/port][/options]
        session_secret: '1wEEnAh11',
        redis: {},
        oauth: {
			sharedSecret: '7969310b79a5e99b21349e2097a5ff40',
			redirectUri: 'http://localhost:3030/auth/grant',
			apiKey: 'db7c687e9e9afbed4cffb118951c7f29',
			scopes: ['read_products', 'write_products', 'read_script_tags', 'write_script_tags']
		}
    },

    production: {
        db: 'mongodb://localhost/sample_api',
        session_secret: '1wEEnAh11',
        redis: {},
        oauth: {
			sharedSecret: '7969310b79a5e99b21349e2097a5ff40',
			redirectUri: 'http://localhost:3030/auth/grant',
			apiKey: 'db7c687e9e9afbed4cffb118951c7f29',
			scopes: ['read_products', 'write_products', 'read_script_tags', 'write_script_tags']
		}
    }
};

export default config;
