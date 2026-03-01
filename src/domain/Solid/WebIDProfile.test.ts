import { describe, it, expect } from 'vitest';
import { WebIDProfile } from './WebIDProfile';

describe('WebIDProfile', () => {
    describe('getIssuerUrls', () => {
        it('returns parsed URL instances', () => {
            const profile = new WebIDProfile(['https://idp.example.com'], [], []);
            expect(profile.getIssuerUrls()[0]).toBeInstanceOf(URL);
        });

        it('returns the correct issuer href', () => {
            const profile = new WebIDProfile(['https://idp.example.com'], [], []);
            expect(profile.getIssuerUrls()[0].href).toBe('https://idp.example.com/');
        });

        it('returns multiple issuers', () => {
            const profile = new WebIDProfile(
                ['https://idp1.example.com', 'https://idp2.example.com'],
                [],
                []
            );
            expect(profile.getIssuerUrls()).toHaveLength(2);
        });

        it('returns an empty array when no issuers provided', () => {
            const profile = new WebIDProfile([], [], []);
            expect(profile.getIssuerUrls()).toHaveLength(0);
        });
    });

    describe('getStorageUrls', () => {
        it('returns parsed URL instances', () => {
            const profile = new WebIDProfile([], ['https://pod.example.com/alice/'], []);
            expect(profile.getStorageUrls()[0]).toBeInstanceOf(URL);
        });

        it('returns the correct storage href', () => {
            const profile = new WebIDProfile([], ['https://pod.example.com/alice/'], []);
            expect(profile.getStorageUrls()[0].href).toBe('https://pod.example.com/alice/');
        });

        it('returns an empty array when no storage URLs provided', () => {
            const profile = new WebIDProfile([], [], []);
            expect(profile.getStorageUrls()).toHaveLength(0);
        });
    });

    describe('getInboxUrl', () => {
        it('returns parsed URL instances', () => {
            const profile = new WebIDProfile([], [], ['https://pod.example.com/alice/inbox/']);
            expect(profile.getInboxUrl()[0]).toBeInstanceOf(URL);
        });

        it('returns multiple inbox URLs', () => {
            const profile = new WebIDProfile(
                [],
                [],
                ['https://pod.example.com/alice/inbox/', 'https://pod.example.com/alice/inbox2/']
            );
            expect(profile.getInboxUrl()).toHaveLength(2);
        });

        it('returns an empty array when no inbox URLs provided', () => {
            const profile = new WebIDProfile([], [], []);
            expect(profile.getInboxUrl()).toHaveLength(0);
        });
    });

    it('handles all three arrays simultaneously', () => {
        const profile = new WebIDProfile(
            ['https://idp.example.com'],
            ['https://pod.example.com/alice/'],
            ['https://pod.example.com/alice/inbox/']
        );
        expect(profile.getIssuerUrls()).toHaveLength(1);
        expect(profile.getStorageUrls()).toHaveLength(1);
        expect(profile.getInboxUrl()).toHaveLength(1);
    });
});
