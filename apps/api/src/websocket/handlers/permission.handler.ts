/**
 * Permission Response Handler
 *
 * Processes permission decisions from the client when the pipeline
 * paused to ask for user approval (e.g. before running an agent).
 * Resolves the pending Promise so the pipeline can continue.
 */

import type { ConnectionContext, PermissionDecision } from "../types.js";
import { emitEvent } from "../event-emitter.js";

export async function handlePermissionResponse(
    parsed: any,
    ctx: ConnectionContext,
): Promise<void> {
    const { requestId, decision } = parsed as {
        requestId: string;
        decision: PermissionDecision;
    };

    if (!requestId || !decision) {
        emitEvent(ctx, { type: 'error', message: 'Invalid permission response' });
        return;
    }

    const pending = ctx.pendingPermissions.get(requestId);
    if (!pending) {
        // Permission already resolved or expired — ignore
        return;
    }

    ctx.pendingPermissions.delete(requestId);
    pending.resolve(decision);

    // If "allow_always", persist the rule update
    if (decision === 'allow_always' && ctx.pipeline) {
        try {
            const { updatePermissionRule } = await import("../../services/permission.service.js");
            await updatePermissionRule(
                ctx.pipeline.userId,
                ctx.pipeline.projectId,
                requestId, // The resource was encoded in the original request
                'allow'
            );
        } catch {
            // Non-critical — the immediate decision still applies
        }
    }
}

/**
 * Request permission from the user and wait for their response.
 * Returns the decision. If the client disconnects, returns 'deny'.
 */
export function requestPermission(
    ctx: ConnectionContext,
    resource: string,
    message: string,
): Promise<PermissionDecision> {
    const requestId = resource; // Use resource as requestId for easy lookup

    return new Promise<PermissionDecision>((resolve) => {
        // Set a timeout — if user doesn't respond in 5 minutes, deny
        const timeout = setTimeout(() => {
            ctx.pendingPermissions.delete(requestId);
            resolve('deny');
        }, 5 * 60 * 1000);

        ctx.pendingPermissions.set(requestId, {
            resolve: (decision) => {
                clearTimeout(timeout);
                resolve(decision);
            },
        });

        emitEvent(ctx, {
            type: 'permission_request',
            requestId,
            resource,
            message,
            options: ['allow', 'deny', 'allow_always'],
        });
    });
}
