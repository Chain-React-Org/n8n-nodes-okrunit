import type {
	IDataObject,
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

interface ApprovalRecord {
	id: string;
	decided_at: string | null;
	[key: string]: unknown;
}

export class OkrunitApprovalDecidedTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OKRunit Approval Decided Trigger',
		name: 'okrunitApprovalDecidedTrigger',
		icon: 'file:../../icons/okrunit.png',
		group: ['trigger'],
		version: 1,
		description: 'Fires when an approval request is approved or rejected in OKRunit',
		defaults: { name: 'Approval Decided' },
		usableAsTool: true,
		inputs: [],
		outputs: ['main'],
		polling: true,
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
					{
						name: 'API Key',
						value: 'apiKey',
					},
					{
						name: 'OAuth2',
						value: 'oAuth2',
					},
				],
				default: 'apiKey',
			},
			{
				displayName: 'Decision Filter',
				name: 'decisionFilter',
				type: 'options',
				options: [
					{ name: 'Approved Only', value: 'approved' },
					{ name: 'Approved or Rejected', value: 'any' },
					{ name: 'Rejected Only', value: 'rejected' },
				],
				default: 'any',
				description: 'Filter to only trigger on specific decision types',
			},
			{
				displayName: 'Priority Filter',
				name: 'priorityFilter',
				type: 'options',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Critical', value: 'critical' },
					{ name: 'High', value: 'high' },
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
				],
				default: '',
				description: 'Only trigger for approvals with this priority',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const authType = this.getNodeParameter('authentication', 0) as string;
		const credentialType = authType === 'oAuth2' ? 'okrunitOAuth2Api' : 'okrunitApi';

		const webhookData = this.getWorkflowStaticData('node');
		const lastPollTime = webhookData.lastPollTime as string | undefined;
		webhookData.lastPollTime = new Date().toISOString();

		const decisionFilter = this.getNodeParameter('decisionFilter') as string;
		const priorityFilter = this.getNodeParameter('priorityFilter') as string;

		const statuses = decisionFilter === 'any' ? ['approved', 'rejected'] : [decisionFilter];
		const results: INodeExecutionData[] = [];

		for (const status of statuses) {
			const qs: Record<string, string> = { status, page_size: '50' };
			if (priorityFilter) qs.priority = priorityFilter;

			const response = (await this.helpers.httpRequestWithAuthentication.call(
				this,
				credentialType,
				{
					method: 'GET',
					url: 'https://okrunit.com/api/v1/approvals',
					json: true,
					qs,
				},
			)) as { data?: ApprovalRecord[] };

			const approvals: ApprovalRecord[] = response.data ?? [];

			for (const approval of approvals) {
				if (lastPollTime && approval.decided_at && approval.decided_at > lastPollTime) {
					results.push({ json: approval as unknown as IDataObject });
				} else if (!lastPollTime && approval.decided_at) {
					results.push({ json: approval as unknown as IDataObject });
				}
			}
		}

		if (results.length === 0) return null;
		return [results];
	}
}
