/**
 * Circular Event Buffer
 *
 * Fixed-capacity ring buffer for recent pipeline events. Used for
 * fast replay on WebSocket reconnect without hitting the database.
 * Falls back to DB replay (PipelineEvent model) when buffer is too old.
 */

import type { ServerEvent } from "./types.js";

interface BufferedEvent {
    seq: number;
    event: ServerEvent;
    timestamp: number;
}

export class CircularEventBuffer {
    private buffer: (BufferedEvent | null)[];
    private head = 0;
    private size = 0;

    constructor(private capacity = 100) {
        this.buffer = new Array(capacity).fill(null);
    }

    /** Push an event into the buffer. Overwrites oldest when full. */
    push(seq: number, event: ServerEvent): void {
        this.buffer[this.head] = { seq, event, timestamp: Date.now() };
        this.head = (this.head + 1) % this.capacity;
        if (this.size < this.capacity) this.size++;
    }

    /** Get all events with seq > afterSeq, sorted ascending. */
    getAfter(afterSeq: number): ServerEvent[] {
        const result: BufferedEvent[] = [];

        for (let i = 0; i < this.size; i++) {
            const idx = (this.head - this.size + i + this.capacity) % this.capacity;
            const entry = this.buffer[idx];
            if (entry && entry.seq > afterSeq) {
                result.push(entry);
            }
        }

        result.sort((a, b) => a.seq - b.seq);
        return result.map(e => e.event);
    }

    /** Check if a given seq is still in the buffer. */
    contains(seq: number): boolean {
        for (let i = 0; i < this.size; i++) {
            const idx = (this.head - this.size + i + this.capacity) % this.capacity;
            if (this.buffer[idx]?.seq === seq) return true;
        }
        return false;
    }

    /** Get the lowest seq still in the buffer, or null if empty. */
    oldestSeq(): number | null {
        if (this.size === 0) return null;
        const idx = (this.head - this.size + this.capacity) % this.capacity;
        return this.buffer[idx]?.seq ?? null;
    }

    /** Clear all events. */
    clear(): void {
        this.buffer.fill(null);
        this.head = 0;
        this.size = 0;
    }
}
