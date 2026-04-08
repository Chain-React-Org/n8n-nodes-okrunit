import {
	NodeConnectionTypes,
	WAIT_INDEFINITELY,
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

export class OkrunitRequestApproval implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OKRunit Request Approval',
		name: 'okrunitRequestApproval',
		icon: 'file:../../icons/okrunit.png',
		group: ['output'],
		version: 1,
		description: 'Create an approval request and wait for a human to approve or reject',
		defaults: { name: 'Request Approval' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'okrunitApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
			},
			{
				name: 'okrunitOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{ name: 'API Key', value: 'apiKey' },
					{ name: 'OAuth2', value: 'oAuth2' },
				],
				default: 'apiKey',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: 'Approval request from n8n',
				description: 'What needs approval? The workflow pauses until a human decides',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				required: true,
				options: [
					{ name: 'Critical', value: 'critical' },
					{ name: 'High', value: 'high' },
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
				],
				default: 'medium',
				description: 'Priority level of the approval request',
			},
			{
				displayName: 'Action Type Name or ID',
				name: 'actionType',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getActionTypes',
				},
				default: '',
				 
				description: 'Category of action being approved. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Context HTML',
						name: 'contextHtml',
						type: 'string',
						typeOptions: { rows: 4 },
						default: '',
						description: 'Rich HTML content displayed to approvers',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						typeOptions: { rows: 4 },
						default: '',
						description: 'Detailed context for the reviewer',
					},
					{
						displayName: 'Expires At',
						name: 'expiresAt',
						type: 'dateTime',
						default: '',
						description: 'When the approval request should automatically expire',
					},
					{
						displayName: 'Metadata',
						name: 'metadata',
						type: 'json',
						default: '{}',
						description: 'Arbitrary JSON data to attach to the approval request',
					},
					{
						displayName: 'Required Approvals',
						name: 'requiredApprovals',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 10 },
						default: 1,
						description: 'Number of approvals needed',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getActionTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					this.getNodeParameter('authentication', 0) === 'oAuth2'
						? 'okrunitOAuth2Api'
						: 'okrunitApi',
					{
						method: 'GET',
						url: 'https://okrunit.com/api/v1/org/action-types',
						json: true,
					},
				);
				const types: string[] = response.data ?? [];
				return types.map((t) => ({ name: t, value: t }));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const authType = this.getNodeParameter('authentication', 0) as string;
		const credentialType = authType === 'oAuth2' ? 'okrunitOAuth2Api' : 'okrunitApi';
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];
		const workflowId = this.getWorkflow().id;

		for (let i = 0; i < items.length; i++) {
			const title = this.getNodeParameter('title', i, 'Approval request from n8n') as string;
			const priority = this.getNodeParameter('priority', i, 'medium') as string;
			const actionType = this.getNodeParameter('actionType', i, '') as string;
			const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			// Get n8n's resume URL — OKRunit will POST the decision here to resume this execution
			const resumeUrl = this.evaluateExpression('{{$execution.resumeUrl}}', i) as string;

			const body: IDataObject = {
				title,
				priority,
				source: 'n8n',
				source_id: `n8n-${workflowId}`,
				idempotency_key: `n8n-wait-${workflowId}-${Date.now()}-${i}`,
				callback_url: resumeUrl,
			};

			if (actionType) body.action_type = actionType;
			if (additionalFields.description) body.description = additionalFields.description;
			if (additionalFields.contextHtml) body.context_html = additionalFields.contextHtml;
			if (additionalFields.expiresAt) body.expires_at = additionalFields.expiresAt;
			if (additionalFields.requiredApprovals) body.required_approvals = additionalFields.requiredApprovals;
			if (additionalFields.metadata) {
				try {
					body.metadata = JSON.parse(additionalFields.metadata as string);
				} catch {
					body.metadata = additionalFields.metadata;
				}
			}

			const response = await this.helpers.httpRequestWithAuthentication.call(
				this,
				credentialType,
				{
					method: 'POST',
					url: 'https://okrunit.com/api/v1/approvals',
					json: true,
					body,
				},
			);

			results.push({ json: response as IDataObject });
		}

		// Pause the workflow until OKRunit POSTs the decision to the resume URL
		await this.putExecutionToWait(WAIT_INDEFINITELY);
		return [results];
	}
}
