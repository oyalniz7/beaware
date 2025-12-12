import { z } from 'zod';

export const AssetTypeEnum = z.enum(["Hardware", "Software"]);

export const AssetSchema = z.object({
    name: z.string().min(1, "Name is required"),
    type: AssetTypeEnum,
    model: z.string().optional(),
    version: z.string().optional(),
    vendor: z.string().optional(),
    cpe: z.string().optional(),
    ipAddress: z.string().optional(),
    location: z.string().optional(),
    // SNMP
    snmpEnabled: z.boolean().default(false).optional(),
    snmpCommunity: z.string().optional(),
    snmpVersion: z.string().default("v2c").optional(),
    snmpPort: z.number().default(161).optional(),
    snmpMetrics: z.string().optional(),
    watchedInterfaces: z.string().optional(),
    // Monitoring Thresholds
    cpuThreshold: z.number().default(80).optional(),
    memoryThreshold: z.number().default(90).optional(),
    storageThreshold: z.number().default(90).optional(),
    alertRules: z.string().optional(),
});

export type AssetFormData = z.infer<typeof AssetSchema>;
