import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		rules: {
			'n8n-nodes-base/node-class-description-icon-not-svg': 'off',
			'@n8n/community-nodes/icon-validation': 'off',
		},
	},
];
