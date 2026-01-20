
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSchedules } from '../useSchedules';

// Mock chrome API
const mockSendMessage = vi.fn();
global.chrome = {
    runtime: {
        sendMessage: mockSendMessage,
    },
} as any;

describe('useSchedules', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch schedules on mount', async () => {
        mockSendMessage.mockImplementation((message) => {
            if (message.type === 'SCHEDULE_GET_ALL') {
                return Promise.resolve({ success: true, data: [] });
            }
            if (message.type === 'SCHEDULE_GET_NEXT') {
                return Promise.resolve({ success: true, data: null });
            }
            return Promise.resolve({ success: false });
        });

        const { result } = renderHook(() => useSchedules());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockSendMessage).toHaveBeenCalledWith({ type: 'SCHEDULE_GET_ALL' });
    });

    it('should delete a schedule successfully', async () => {
        mockSendMessage.mockImplementation((message) => {
            if (message.type === 'SCHEDULE_GET_ALL') {
                return Promise.resolve({ success: true, data: [] });
            }
            if (message.type === 'SCHEDULE_GET_NEXT') {
                return Promise.resolve({ success: true, data: null });
            }
            if (message.type === 'SCHEDULE_DELETE') {
                return Promise.resolve({ success: true, data: true }); // Successful delete
            }
            return Promise.resolve({ success: false });
        });

        const { result } = renderHook(() => useSchedules());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await result.current.deleteSchedule('test-id');

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'SCHEDULE_DELETE',
            id: 'test-id',
        });
        expect(result.current.error).toBeNull();
    });

    it('should throw an error if delete returns false (not found)', async () => {
        mockSendMessage.mockImplementation((message) => {
            if (message.type === 'SCHEDULE_GET_ALL') {
                return Promise.resolve({ success: true, data: [] });
            }
            if (message.type === 'SCHEDULE_GET_NEXT') {
                return Promise.resolve({ success: true, data: null });
            }
            if (message.type === 'SCHEDULE_DELETE') {
                return Promise.resolve({ success: true, data: false }); // Failed/Not found delete
            }
            return Promise.resolve({ success: false });
        });

        const { result } = renderHook(() => useSchedules());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await expect(result.current.deleteSchedule('missing-id')).rejects.toThrow(
            'Schedule not found or could not be deleted'
        );

        // Error state should also be updated
        await waitFor(() => {
            expect(result.current.error).toBe('Schedule not found or could not be deleted');
        });
    });

    it('should throw an error if sendMessage fails', async () => {
        mockSendMessage.mockImplementation((message) => {
            if (message.type === 'SCHEDULE_GET_ALL') {
                return Promise.resolve({ success: true, data: [] });
            }
            if (message.type === 'SCHEDULE_GET_NEXT') {
                return Promise.resolve({ success: true, data: null });
            }
            if (message.type === 'SCHEDULE_DELETE') {
                return Promise.resolve({ success: false, error: 'Backend error' });
            }
            return Promise.resolve({ success: false });
        });

        const { result } = renderHook(() => useSchedules());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await expect(result.current.deleteSchedule('error-id')).rejects.toThrow(
            'Backend error'
        );
    });
});
