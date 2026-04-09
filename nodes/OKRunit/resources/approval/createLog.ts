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
			},
			{
				displayName: 'Source URL',
				name: 'sourceUrl',
				type: 'string',
				default: '',
				placeholder: 'https://...',
				description:
					'URL of the n8n workflow or source system for reference',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Arbitrary JSON data to attach to the log entry',
			},
		],
	},
];
