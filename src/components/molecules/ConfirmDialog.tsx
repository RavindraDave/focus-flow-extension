/**
 * ConfirmDialog - Themed confirmation dialog
 * Replaces native browser confirm() with custom themed UI
 */

import React, { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * ConfirmDialog Component
 * Theme-aware confirmation dialog with accessibility support
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning',
    isLoading = false,
    onConfirm,
    onCancel,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    // Handle keyboard events
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                onConfirm();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, onCancel]);

    // Focus trap and initial focus
    useEffect(() => {
        if (isOpen && confirmButtonRef.current) {
            confirmButtonRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: '⚠️',
            iconBg: 'bg-error/10',
            iconColor: 'text-error',
            confirmButton: 'bg-error hover:bg-error/90 text-text-inverse',
        },
        warning: {
            icon: '⚡',
            iconBg: 'bg-warning/10',
            iconColor: 'text-warning',
            confirmButton: 'bg-warning hover:bg-warning/90 text-text-inverse',
        },
        info: {
            icon: 'ℹ️',
            iconBg: 'bg-info/10',
            iconColor: 'text-info',
            confirmButton: 'bg-accent hover:bg-accent-hover text-text-inverse',
        },
    };

    const style = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-sm"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
        >
            <div
                ref={dialogRef}
                className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center mb-4`}>
                    <span className={`text-2xl ${style.iconColor}`}>{style.icon}</span>
                </div>

                {/* Title */}
                <h3
                    id="dialog-title"
                    className="text-xl font-bold text-text-primary mb-2"
                >
                    {title}
                </h3>

                {/* Message */}
                <p
                    id="dialog-description"
                    className="text-text-secondary mb-6 whitespace-pre-line"
                >
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmButtonRef}
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${style.confirmButton}`}
                    >
                        {isLoading && (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
