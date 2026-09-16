export type EntityType = "events" | "shops" | "challenges" | "announcements" | "prizes" | "members";
export type DataRecord = Record<string, string | number | boolean | null> & { id: string };
export type PublicSnapshot = { demo: boolean; event: DataRecord; shops: DataRecord[]; challenges: DataRecord[]; announcements: DataRecord[]; prizes: DataRecord[]; member: DataRecord | null; completedChallengeIds: string[]; redemptions: DataRecord[] };
