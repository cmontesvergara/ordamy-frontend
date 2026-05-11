import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Expense {
    id: string;
    number: number;
    description: string;
    amount: number;
    expenseDate: string;
    invoiceNumber?: string;
    supplierId?: string;
    paymentMethodId: string;
    categoryId: string;
    notes?: string;
    category?: { id: string; name: string };
    supplier?: { id: string; name: string };
    paymentMethod?: { id: string; name: string };
    attachments?: Attachment[];
}

export interface Attachment {
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    createdAt: string;
}

export interface CreateExpenseResponse {
    success: boolean;
    data: Expense;
    warnings?: {
        message: string;
        failed: { fileName: string; error: string }[];
    };
    message?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
    private url = `${environment.middlewareBaseUrl}/api/expenses`;

    constructor(private http: HttpClient) { }

    list(params: any = {}) {
        let httpParams = new HttpParams();
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                httpParams = httpParams.set(key, params[key]);
            }
        });
        return this.http.get<any>(this.url, { params: httpParams, withCredentials: true });
    }

    get(id: string): Observable<{ success: boolean; data: Expense }> {
        return this.http.get<any>(`${this.url}/${id}`, { withCredentials: true });
    }

    /**
     * Create expense with optional file attachment
     * Supports both JSON (no file) and FormData (with single file)
     */
    create(data: any, file?: File): Observable<CreateExpenseResponse> {
        // If no file, send as JSON (backward compatible)
        if (!file) {
            return this.http.post<CreateExpenseResponse>(this.url, data, { 
                withCredentials: true 
            });
        }

        // If file present, use FormData
        const formData = new FormData();
        
        // Add expense fields
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, String(data[key]));
            }
        });

        // Add single file
        formData.append('files', file, file.name);

        return this.http.post<CreateExpenseResponse>(this.url, formData, { 
            withCredentials: true 
        });
    }

    update(id: string, data: any) {
        return this.http.put<any>(`${this.url}/${id}`, data, { withCredentials: true });
    }

    delete(id: string) {
        return this.http.delete<any>(`${this.url}/${id}`, { withCredentials: true });
    }

    // Attachment methods
    
    /**
     * Upload attachment to existing expense
     */
    uploadAttachment(expenseId: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        
        return this.http.post(`${this.url}/${expenseId}/attachments`, formData, { 
            withCredentials: true 
        });
    }

    /**
     * Get all attachments for an expense
     */
    getAttachments(expenseId: string): Observable<{ success: boolean; data: Attachment[] }> {
        return this.http.get<any>(`${this.url}/${expenseId}/attachments`, { withCredentials: true });
    }

    /**
     * Delete an attachment from an expense
     */
    deleteAttachment(expenseId: string, attachmentId: string): Observable<any> {
        return this.http.delete(`${this.url}/${expenseId}/attachments/${attachmentId}`, { 
            withCredentials: true 
        });
    }

    /**
     * Get presigned download URL for attachment
     */
    getDownloadUrl(expenseId: string, attachmentId: string, expirySeconds: number = 3600): Observable<any> {
        return this.http.post(`${this.url}/${expenseId}/attachments/${attachmentId}/download-url`, 
            { expirySeconds }, 
            { withCredentials: true }
        );
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get icon class based on mime type
     */
    getFileIconClass(mimeType: string): string {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
        if (mimeType.includes('excel') || mimeType.includes('sheet') || mimeType.includes('csv')) return 'spreadsheet';
        return 'file';
    }
}