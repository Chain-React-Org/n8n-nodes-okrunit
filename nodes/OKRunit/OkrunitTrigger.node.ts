import type {
	IDataObject,
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/** Normalize any ISO-8601 timestamp to Z-suffix format for safe string comparison. */
function normalizeTs(ts: string): string {
	if (ts.endsWith('Z')) return ts;
	if (ts.endsWith('+00:00')) return ts.slice(0, -6) + 'Z';
	return new Date(ts).toISOString();
}

interface ApprovalRecord {
	id: string;
	created_at: string;
	decided_at: string | null;
	is_log: boolean;
	[key: string]: unknown;
}

export class OkrunitTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OKrunit Trigger',
		name: 'okrunitTrigger',
		icon: 'file:../../icons/okrunit.png',
		group: ['trigger'],
		version: 1,
		subtitle:
			'={{$parameter["event"] === "approvalDecided" ? "Approval Decided" : "New Approval Request"}}',
		description: 'Fires when approval events occur in OKRunit',
		defaults: { name: 'OKrunit Trigger' },
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
					{ name: 'API Key', value: 'apiKey' },
					{ name: 'OAuth2', value: 'oAuth2' },
				],
				default: 'apiKey',
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'New Approval Request',
						value: 'newApproval',
						description: 'Fires when a new approval request is created',
					},
					{
						name: 'Approval Decided',
						value: 'approvalDecided',
						description:
							'Fires when an approval is approved or rejected',
					},
				],
				default: 'newApproval',
				description: 'The event to listen for',
			},
			{
				displayName: 'Status Filter',
				name: 'statusFilter',
				type: 'options',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Expired', value: 'expired' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Rejected', value: 'rejected' },
				],
				default: '',
				displayOptions: {
					show: {
						event: ['newApproval'],
					},
				},
				description: 'Only trigger for approvals with this status',
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
				displayOptions: {
					show: {
						event: ['approvalDecided'],
					},
				},
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

	async poll(
		this: IPollFunctions,
	): Promise<INodeExecutionData[][] | null> {
		const authType = this.getNodeParameter('authentication', 0) as string;
		const credentialType =
			authType === 'oAuth2' ? 'okrunitOAuth2Api' : 'okrunitApi';
		const event = this.getNodeParameter('event') as string;
		const isManual = this.getMode() === 'manual';

		// In manual/test mode, return the most recent approval so the user
		// can see available fields and use them as variables in later nodes.
		if (isManual) {
			const qs: Record<string, string> = { page_size: '1' };
			if (event === 'approvalDecided') {
				qs.status = 'approved,rejected';
			}

			const response =
				(await this.helpers.httpRequestWithAuthentication.call(
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
			if (approvals.length === 0) return null;

			const approval = approvals[0];
			return [[{
				json: {
					...approval,
					request_id: approval.id,
				} as unknown as IDataObject,
			}]];
		}

		const webhookData = this.getWorkflowStaticData('node');
		const rawLastTimestamp = (webhookData.lastTimestamp as string | undefined) ?? '';
		const lastTimestamp = rawLastTimestamp ? normalizeTs(rawLastTimestamp) : '';
		const seenIds = (webhookData.seenIds as string[] | undefined) ?? [];
		const isFirstPoll = !lastTimestamp;

		const priorityFilter = this.getNodeParameter('priorityFilter') as string;
		const workflowId = this.getWorkflow().id;

		const results: INodeExecutionData[] = [];
		const newSeenIds: string[] = [];
		let newestTimestamp = lastTimestamp;

		if (event === 'newApproval') {
			const statusFilter = this.getNodeParameter('statusFilter') as string;

			const qs: Record<string, string> = {
				page_size: '50',
				exclude_source_id: `n8n-${workflowId}`,
			};
			if (statusFilter) qs.status = statusFilter;
			if (priorityFilter) qs.priority = priorityFilter;
			if (lastTimestamp) qs.created_after = lastTimestamp;

			let response: { data?: ApprovalRecord[] };
			try {
				response =
					(await this.helpers.httpRequestWithAuthentication.call(
						this,
						credentialType,
						{
							method: 'GET',
							url: 'https://okrunit.com/api/v1/approvals',
							json: true,
							qs,
						},
					)) as { data?: ApprovalRecord[] };
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Failed to fetch approvals: ${error instanceof Error ? error.message : String(error)}`,
				);
			}

			const approvals: ApprovalRecord[] = response.data ?? [];

			if (isFirstPoll) {
				const twoMinutesAgo = new Date(
					Date.now() - 2 * 60 * 1000,
				).toISOString();
				for (const approval of approvals) {
					const ts = normalizeTs(approval.created_at);
					if (!approval.is_log && ts > twoMinutesAgo) {
						results.push({
							json: approval as unknown as IDataObject,
						});
						newSeenIds.push(approval.id);
					}
					if (!approval.is_log && ts > newestTimestamp) {
						newestTimestamp = ts;
					}
				}
				if (!newestTimestamp) {
					newestTimestamp = new Date().toISOString();
				}
			} else {
				for (const approval of approvals) {
					const ts = normalizeTs(approval.created_at);
					if (
						!approval.is_log &&
						ts > lastTimestamp &&
						!seenIds.includes(approval.id)
					) {
						results.push({
							json: approval as unknown as IDataObject,
						});
						newSeenIds.push(approval.id);
					}
					if (!approval.is_log && ts > newestTimestamp) {
						newestTimestamp = ts;
					}
				}
			}
		} else if (event === 'approvalDecided') {
			const decisionFilter = this.getNodeParameter(
				'decisionFilter',
			) as string;
			const statuses =
				decisionFilter === 'any'
					? ['approved', 'rejected']
					: [decisionFilter];

			for (const status of statuses) {
				const qs: Record<string, string> = {
					status,
					page_size: '50',
					exclude_source_id: `n8n-${workflowId}`,
				};
				if (priorityFilter) qs.priority = priorityFilter;
				if (lastTimestamp) qs.decided_after = lastTimestamp;

				let response: { data?: ApprovalRecord[] };
				try {
					response =
						(await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: 'https://okrunit.com/api/v1/approvals',
								json: true,
								qs,
							},
						)) as { data?: ApprovalRecord[] };
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to fetch approvals: ${error instanceof Error ? error.message : String(error)}`,
					);
				}

				const approvals: ApprovalRecord[] = response.data ?? [];

				if (isFirstPoll) {
					const twoMinutesAgo = new Date(
						Date.now() - 2 * 60 * 1000,
					).toISOString();
					for (const approval of approvals) {
						const ts = normalizeTs(approval.decided_at ?? approval.created_at);
						if (
							!approval.is_log &&
							approval.decided_at &&
							ts > twoMinutesAgo
						) {
							results.push({
								json: approval as unknown as IDataObject,
							});
							newSeenIds.push(approval.id);
						}
						if (!approval.is_log && approval.decided_at && ts > newestTimestamp) {
							newestTimestamp = ts;
						}
					}
				} else {
					for (const approval of approvals) {
						const ts = normalizeTs(approval.decided_at ?? approval.created_at);
						if (
							!approval.is_log &&
							approval.decided_at &&
							ts > lastTimestamp &&
							!seenIds.includes(approval.id)
						) {
							results.push({
								json: approval as unknown as IDataObject,
							});
							newSeenIds.push(approval.id);
						}
						if (!approval.is_log && approval.decided_at && ts > newestTimestamp) {
							newestTimestamp = ts;
						}
					}
				}

				if (isFirstPoll && !newestTimestamp) {
					newestTimestamp = new Date().toISOString();
				}
			}
		}

		if (results.length === 0) {
			// No new matching results. If there are newer qualifying records,
			// safe to advance timestamp since there's nothing to lose.
			if (newestTimestamp > lastTimestamp) {
				webhookData.lastTimestamp = newestTimestamp;
				webhookData.seenIds = [];
			}
			return null;
		}

		// Return only ONE item per poll so each approval gets its own
		// workflow execution. The rest will be picked up on subsequent polls
		// via the seenIds dedup mechanism.
		const MAX_SEEN_IDS = 200;
		const itemToReturn = results[0];
		const returnedId = newSeenIds[0];

		const mergedSeenIds = [...new Set([returnedId, ...seenIds])].slice(
			0,
			MAX_SEEN_IDS,
		);
		webhookData.seenIds = mergedSeenIds;

		// Only advance the timestamp when ALL items at the current window
		// have been returned (i.e. this is the last one left).
		if (results.length === 1 && newestTimestamp > lastTimestamp) {
			webhookData.lastTimestamp = newestTimestamp;
		}

		// Add request_id alias so it's easy to find in downstream nodes
		itemToReturn.json.request_id = itemToReturn.json.id;
		return [[itemToReturn]];
	}
}
