import { ApiClient } from "./apiClient";

export class ReportService{
    static async getReport(reportID){
        return ApiClient.get(`/dynamodb/report/${reportID}`);
    }

    static async getReports(){
        return ApiClient.get(`/dynamodb/reports`);
    }

    static async uploadReport(form){
        return ApiClient.post(`/dynamodb/report`, form);
    }

    static async updateReport(reportID, status){
        return ApiClient.put(`/dynamodb/report/${reportID}`, status);
    }

    static async deleteReport(reportID){
        return ApiClient.delete(`/dynamodb/report/${reportID}`);
    }
}