import {
	NodeConnectionTypes,
	NodeApiError,
	NodeOperationError,
	WAIT_INDEFINITELY,
	type IDataObject,
	type IExecuteFunctions,
	type JsonObject,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { approvalDescription } from './resources/approval';
import { commentDescription } from './resources/comment';

const POLL_INTERVAL_MS = 5_000;

/** Returns true if the URL points to a local/private address. */
function isLocalUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString);
		const h = url.hostname.toLowerCase();
		if (
			h === 'localhost' ||
			h === '127.0.0.1' ||
			h === '::1' ||
			h === '[::1]' ||
			h === '0.0.0.0' ||
			h.endsWith('.local')
		) {
			return true;
		}
		const parts = h.split('.');
		if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
			const [a, b] = parts.map(Number);
			if (a === 10) return true;
			if (a === 172 && b >= 16 && b <= 31) return true;
			if (a === 192 && b === 168) return true;
			if (a === 169 && b === 254) return true;
			if (a === 127) return true;
		}
		return false;
	} catch {
		return false;
	}
}

export class OKRunit implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OKrunit',
		name: 'oKRunit',
		icon: 'file:../../icons/okrunit.png',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Human-in-the-loop approval gateway',
		defaults: {
			name: 'OKrunit',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: `={{
			$parameter["operation"] === "create" && $parameter["waitForDecision"] !== false
				? ["Approved", "Rejected"]
				: ["main"]
		}}`,
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Approval',
						value: 'approval',
					},
					{
						name: 'Comment',
						value: 'comment',
					},
				],
				default: 'approval',
			},
			...approvalDescription,
			...commentDescription,
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
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					this.getNodeParameter('authentication', 0) === 'oAuth2'
						? 'okrunitOAuth2Api'
						: 'okrunitApi',
					{
						method: 'GET',
						url: 'https://okrunit.com/api/v1/templates?target_app=n8n',
						json: true,
					},
				);

				const templates: { id: string; name: string; description?: string }[] =
					response.data ?? [];
				return [
					{ name: '(None)', value: '' },
					...templates.map((t) => ({
						name: t.description ? `${t.name} - ${t.description}` : t.name,
						value: t.id,
					})),
				];
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const authType = this.getNodeParameter('authentication', 0) as string;
		const credentialType =
			authType === 'oAuth2' ? 'okrunitOAuth2Api' : 'okrunitApi';
		const baseURL = 'https://okrunit.com';
		const workflowId = this.getWorkflow().id;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'approval') {
					if (operation === 'create') {
						const templateId = this.getNodeParameter(
							'templateId',
							i,
							'',
						) as string;
						const title = this.getNodeParameter(
							'title',
							i,
							'',
						) as string;
						const description = this.getNodeParameter(
							'description',
							i,
							'',
						) as string;
						const priority = this.getNodeParameter(
							'priority',
							i,
							'',
						) as string;
						const waitForDecision = this.getNodeParameter(
							'waitForDecision',
							i,
							false,
						) as boolean;
						const additionalFields = this.getNodeParameter(
							'additionalFields',
							i,
							{},
						) as IDataObject;

						const body: IDataObject = {
							source: 'n8n',
							source_id: `n8n-${workflowId}`,
							idempotency_key: waitForDecision
								? `n8n-wait-${workflowId}-${Date.now()}-${i}`
								: `n8n-${workflowId}-${Date.now()}-${i}`,
						};

						if (templateId) body.template_id = templateId;
						body.title = title || 'Approval request from n8n';
						if (description) body.description = description;
						if (priority) body.priority = priority;
						if (additionalFields.actionType)
							body.action_type = additionalFields.actionType;
						if (additionalFields.contextHtml)
							body.context_html = additionalFields.contextHtml;
						if (additionalFields.expiresAt)
							body.expires_at = additionalFields.expiresAt;
						if (additionalFields.requiredApprovals)
							body.required_approvals = additionalFields.requiredApprovals;
						if (additionalFields.metadata) {
							try {
								body.metadata = JSON.parse(
									additionalFields.metadata as string,
								);
							} catch {
								body.metadata = additionalFields.metadata;
							}
						}

						// Determine resume strategy: callback (cloud) or poll (local)
						let usePolling = false;
						if (waitForDecision) {
							const resumeUrl = this.evaluateExpression(
								'{{$execution.resumeUrl}}',
								i,
							) as string;

							if (isLocalUrl(resumeUrl)) {
								// n8n is self-hosted on a local/private network.
								// OKRunit cannot reach it, so we poll instead.
								usePolling = true;
							} else {
								body.callback_url = resumeUrl;
							}
						} else if (additionalFields.callbackUrl) {
							body.callback_url = additionalFields.callbackUrl;
						}

						const response =
							await this.helpers.httpRequestWithAuthentication.call(
								this,
								credentialType,
								{
									method: 'POST',
									url: `${baseURL}/api/v1/approvals`,
									json: true,
									body,
								},
							);

						if (waitForDecision && usePolling) {
							// Poll until the approval is decided
							const approvalData = (response as IDataObject)
								.data as IDataObject | undefined;
							const approvalId =
								approvalData?.id ??
								(response as IDataObject).id;

							if (!approvalId) {
								throw new NodeOperationError(
									this.getNode(),
									'Could not determine approval ID from response',
									{ itemIndex: i },
								);
							}

							let decided = false;
							let result: IDataObject = response as IDataObject;

							while (!decided) {
								await new Promise((resolve) =>
									setTimeout(resolve, POLL_INTERVAL_MS),
								);

								const pollResponse =
									await this.helpers.httpRequestWithAuthentication.call(
										this,
										credentialType,
										{
											method: 'GET',
											url: `${baseURL}/api/v1/approvals/${approvalId}`,
											json: true,
										},
									);

								const pollData = (pollResponse as IDataObject)
									.data as IDataObject | undefined;
								const status =
									pollData?.status ??
									(pollResponse as IDataObject).status;

								if (
									status &&
									status !== 'pending'
								) {
									decided = true;
									result = pollData ?? (pollResponse as IDataObject);
								}
							}

							const item: INodeExecutionData = {
								json: result,
								pairedItem: { item: i },
							};
							// Route to output 0 (Approved) or output 1 (Rejected)
							const isApproved = result.status === 'approved';
							return isApproved ? [[item], []] : [[], [item]];
						}

						if (waitForDecision) {
							// Cloud/public n8n: use callback to resume
							await this.putExecutionToWait(WAIT_INDEFINITELY);

							// Execution resumes here after OKRunit calls the callback URL.
							// Re-fetch the approval to get the actual decision status.
							const approvalData = (response as IDataObject)
								.data as IDataObject | undefined;
							const approvalId =
								approvalData?.id ??
								(response as IDataObject).id;

							const decisionResponse =
								await this.helpers.httpRequestWithAuthentication.call(
									this,
									credentialType,
									{
										method: 'GET',
										url: `${baseURL}/api/v1/approvals/${approvalId}`,
										json: true,
									},
								);

							const decisionData = (decisionResponse as IDataObject)
								.data as IDataObject | undefined;
							const result = decisionData ?? (decisionResponse as IDataObject);
							const item: INodeExecutionData = {
								json: result,
								pairedItem: { item: i },
							};
							const isApproved = result.status === 'approved';
							return isApproved ? [[item], []] : [[], [item]];
						}

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'createLog') {
						const title = this.getNodeParameter('logTitle', i) as string;
						const additionalFields = this.getNodeParameter(
							'logAdditionalFields',
							i,
							{},
						) as IDataObject;

						const body: IDataObject = {
							title,
							source: 'n8n',
							is_log: true,
							source_id: `n8n-${workflowId}`,
							idempotency_key: `n8n-${workflowId}-${Date.now()}-${i}`,
						};

						if (additionalFields.description)
							body.description = additionalFields.description;
						if (additionalFields.sourceUrl)
							body.source_url = additionalFields.sourceUrl;
						if (additionalFields.metadata) {
							try {
								body.metadata = JSON.parse(
									additionalFields.metadata as string,
								);
							} catch {
								body.metadata = additionalFields.metadata;
							}
						}

						const response =
							await this.helpers.httpRequestWithAuthentication.call(
								this,
								credentialType,
								{
									method: 'POST',
									url: `${baseURL}/api/v1/approvals`,
									json: true,
									body,
								},
							);

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'get') {
						const approvalId = this.getNodeParameter(
							'approvalId',
							i,
						) as string;

						const response =
							await this.helpers.httpRequestWithAuthentication.call(
								this,
								credentialType,
								{
									method: 'GET',
									url: `${baseURL}/api/v1/approvals/${approvalId}`,
									json: true,
								},
							);

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter(
							'returnAll',
							i,
						) as boolean;
						const filters = this.getNodeParameter(
							'filters',
							i,
							{},
						) as IDataObject;
						const qs: IDataObject = {};

						if (filters.status) qs.status = filters.status;
						if (filters.priority) qs.priority = filters.priority;
						if (filters.search) qs.search = filters.search;

						if (returnAll) {
							let page = 1;
							const pageSize = 100;
							let hasMore = true;

							while (hasMore) {
								qs.page = page;
								qs.page_size = pageSize;

								const response =
									await this.helpers.httpRequestWithAuthentication.call(
										this,
										credentialType,
										{
											method: 'GET',
											url: `${baseURL}/api/v1/approvals`,
											json: true,
											qs,
										},
									);

								const data: IDataObject[] =
									((response as IDataObject).data as IDataObject[]) ?? [];
								for (const item of data) {
									returnData.push({
										json: item,
										pairedItem: { item: i },
									});
								}

								hasMore = data.length >= pageSize;
								page++;
							}
						} else {
							const limit = this.getNodeParameter(
								'limit',
								i,
								50,
							) as number;
							qs.page_size = limit;

							const response =
								await this.helpers.httpRequestWithAuthentication.call(
									this,
									credentialType,
									{
										method: 'GET',
										url: `${baseURL}/api/v1/approvals`,
										json: true,
										qs,
									},
								);

							const data: IDataObject[] =
								((response as IDataObject).data as IDataObject[]) ?? [];
							for (const item of data.slice(0, limit)) {
								returnData.push({
									json: item,
									pairedItem: { item: i },
								});
							}
						}
					}
				} else if (resource === 'comment') {
					const approvalId = this.getNodeParameter(
						'approvalId',
						i,
					) as string;

					if (operation === 'create') {
						const commentBody = this.getNodeParameter(
							'body',
							i,
						) as string;

						const response =
							await this.helpers.httpRequestWithAuthentication.call(
								this,
								credentialType,
								{
									method: 'POST',
									url: `${baseURL}/api/v1/approvals/${approvalId}/comments`,
									json: true,
									body: { body: commentBody, source: 'n8n' },
								},
							);

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'getAll') {
						const response =
							await this.helpers.httpRequestWithAuthentication.call(
								this,
								credentialType,
								{
									method: 'GET',
									url: `${baseURL}/api/v1/approvals/${approvalId}/comments`,
									json: true,
								},
							);

						const data: IDataObject[] =
							((response as IDataObject).data as IDataObject[]) ?? [];
						for (const item of data) {
							returnData.push({
								json: item,
								pairedItem: { item: i },
							});
						}
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
