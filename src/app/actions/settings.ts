'use server'

import { cookies } from 'next/headers';

const API_KEY_COOKIE = 'nvd_api_key';

/**
 * Save NVD API key
 */
export async function saveApiKey(apiKey: string) {
    try {
        if (!apiKey || apiKey.trim() === '') {
            return { success: false, error: 'API key cannot be empty' };
        }

        // Store in cookie (encrypted in production, you might want to use a database instead)
        (await cookies()).set(API_KEY_COOKIE, apiKey, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 365, // 1 year
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to save API key:', error);
        return { success: false, error: 'Failed to save API key' };
    }
}

/**
 * Get stored NVD API key
 */
export async function getApiKey(): Promise<string | undefined> {
    try {
        const cookieStore = await cookies();
        const apiKey = cookieStore.get(API_KEY_COOKIE);
        return apiKey?.value || process.env.NVD_API_KEY;
    } catch (error) {
        console.error('Failed to get API key:', error);
        return process.env.NVD_API_KEY;
    }
}

/**
 * Delete stored API key
 */
export async function deleteApiKey() {
    try {
        (await cookies()).delete(API_KEY_COOKIE);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete API key:', error);
        return { success: false, error: 'Failed to delete API key' };
    }
}

/**
 * Check if API key is configured (either in env or cookie)
 */
export async function hasApiKey(): Promise<boolean> {
    const key = await getApiKey();
    return !!key;
}
