export interface FileUpload {
  id: string;
  filename: string;
  url?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  data?: any;
  error?: string;
  retryCount: number;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  sku?: string;
  description?: string;
  category?: string;
}
