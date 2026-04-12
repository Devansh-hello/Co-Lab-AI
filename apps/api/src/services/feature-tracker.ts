/**
 * Feature Tracker Service
 *
 * Manages feature lifecycle within a project. Features are extracted
 * from the orchestrator's task file and tracked through the pipeline.
 *
 * Lifecycle: planned → architected → in_progress → in_review → approved → deployed
 */

import { Feature, type FeatureStatus } from "../models/feature.model.js";
import type { TaskFile } from "../agents/types.js";

/**
 * Extract features from the orchestrator's task file and create/update
 * Feature documents. Called after the planning phase completes.
 */
export async function syncFeaturesFromPlan(
    projectId: string,
    userId: string,
    taskFile: TaskFile,
    messageId: string,
): Promise<string[]> {
    const featureNames = taskFile.features || [];
    if (featureNames.length === 0) return [];

    const createdIds: string[] = [];

    for (const name of featureNames) {
        // Check if this feature already exists in the project
        const existing = await Feature.findOne({ projectId, name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } });

        if (existing) {
            // Update existing feature — link the new message
            existing.linkedMessages.push(messageId as any);
            if (existing.status === 'planned') {
                await transitionStatus(existing, 'architected', 'Plan updated by orchestrator');
            }
            await existing.save();
            createdIds.push(existing._id.toString());
        } else {
            // Create new feature
            const feature = await Feature.create({
                projectId,
                userId,
                name,
                description: findFeatureDescription(name, taskFile),
                status: 'architected',
                priority: inferPriority(name, taskFile),
                acceptanceCriteria: extractAcceptanceCriteria(name, taskFile),
                linkedMessages: [messageId],
                statusHistory: [{ from: 'planned', to: 'architected', reason: 'Created from orchestrator plan' }],
            });
            createdIds.push(feature._id.toString());
        }
    }

    return createdIds;
}

/**
 * Advance all features for a project to a new status.
 * Used by pipeline handlers at phase transitions.
 */
export async function advanceFeatures(
    projectId: string,
    targetStatus: FeatureStatus,
    reason: string,
): Promise<number> {
    const statusOrder: FeatureStatus[] = ['planned', 'architected', 'in_progress', 'in_review', 'approved', 'deployed'];
    const targetIdx = statusOrder.indexOf(targetStatus);

    // Only advance features that are behind the target status
    const eligibleStatuses = statusOrder.slice(0, targetIdx);
    if (eligibleStatuses.length === 0) return 0;

    const features = await Feature.find({
        projectId,
        status: { $in: eligibleStatuses },
    });

    for (const feature of features) {
        await transitionStatus(feature, targetStatus, reason);
        await feature.save();
    }

    return features.length;
}

/**
 * Update quality scores on features after a review.
 */
export async function updateFeatureQuality(
    projectId: string,
    grade: string,
    overall: number,
): Promise<void> {
    await Feature.updateMany(
        { projectId, status: { $in: ['in_review', 'in_progress'] } },
        { $set: { 'qualityScore.grade': grade, 'qualityScore.overall': overall } },
    );
}

/**
 * Get feature summary for a project (counts by status).
 */
export async function getFeatureSummary(projectId: string): Promise<Record<string, number>> {
    const features = await Feature.find({ projectId }).lean();
    const summary: Record<string, number> = {
        total: features.length,
        planned: 0, architected: 0, in_progress: 0, in_review: 0, approved: 0, deployed: 0,
    };
    for (const f of features) {
        if (summary[f.status] !== undefined) summary[f.status]++;
    }
    return summary;
}

// ─── Helpers ───────────────────────────────────────────────────

async function transitionStatus(feature: any, to: FeatureStatus, reason: string) {
    const from = feature.status;
    if (from === to) return;
    feature.status = to;
    feature.statusHistory.push({ from, to, changedAt: new Date(), reason });
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findFeatureDescription(name: string, taskFile: TaskFile): string {
    const allTasks = [...(taskFile.frontendTasks || []), ...(taskFile.backendTasks || [])];
    const related = allTasks.find(t =>
        (t.description || '').toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes((t.description || '').toLowerCase().slice(0, 20))
    );
    return related?.details || related?.description || name;
}

function inferPriority(name: string, taskFile: TaskFile): string {
    const lowerName = name.toLowerCase();
    if (/auth|login|security|payment/.test(lowerName)) return 'critical';
    if (/api|database|core/.test(lowerName)) return 'high';
    if (/ui|style|theme|layout/.test(lowerName)) return 'medium';
    return 'medium';
}

function extractAcceptanceCriteria(name: string, taskFile: TaskFile): string[] {
    const criteria: string[] = [];
    const endpoints = taskFile.apiContract?.endpoints || [];
    const relatedEndpoints = endpoints.filter(ep =>
        ep.description?.toLowerCase().includes(name.toLowerCase())
    );
    for (const ep of relatedEndpoints.slice(0, 5)) {
        criteria.push(`${ep.method} ${ep.path} — ${ep.description}`);
    }
    return criteria;
}
