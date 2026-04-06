import type { INodeProperties } from 'n8n-workflow';

const showOnlyForLogCreate = {
	operation: ['createLog'],
	resource: ['approval'],
};

export const approvalCreateLogDescription: INodeProperties[] = [
	{
		displayName: 'Title',
		name: 'logTitle',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showOnlyForLogCreate,
		},
		description: 'Short title for the activity log entry (max 500 characters)',
		routing: {
			send: {
				type: 'body',
				property: 'title',
			},
		},
	},
	{
		// Always send source: "n8n"
		displayName: 'Source',
		name: 'logSource',
		type: 'hidden',
		default: 'n8n',
		displayOptions: {
			show: showOnlyForLogCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'source',
			},
		},
	},
	{
		// Always send is_log: true
		displayName: 'Is Log',
		name: 'isLog',
		type: 'hidden',
		default: true,
		displayOptions: {
			show: showOnlyForLogCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'is_log',
			},
		},
	},
	{
		// Auto-generate an idempotency key
		displayName: 'Idempotency Key',
		name: 'logIdempotencyKey',
		type: 'hidden',
		default: '={{$guid}}',
		displayOptions: {
			show: showOnlyForLogCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'idempotency_key',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'logAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForLogCreate,
		},
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Detailed description (max 5000 characters)',
				routing: {
					send: {
						type: 'body',
						property: 'description',
					},
				},
			},
			{
				displayName: 'Source URL',
				name: 'sourceUrl',
				type: 'string',
				default: '',
				placeholder: 'https://...',
				description: 'URL of the n8n workflow or source system for reference',
				routing: {
					send: {
						type: 'body',
						property: 'source_url',
					},
				},
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Arbitrary JSON data to attach to the log entry',
				routing: {
					send: {
						type: 'body',
						property: 'metadata',
						value: '={{JSON.parse($value)}}',
					},
				},
			},
		],
	},
];
