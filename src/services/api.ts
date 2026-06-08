const API_BASE_URL = "https://api-event-opera.nuviotech.co";

export class ApiService {
  static async submitScreenLayout(
    screenLayoutData: unknown,
    totalRows: number,
    totalColumns: number,
    screenId: unknown,
    frontendScene: unknown,
  ): Promise<unknown> {
    try {
      const response = await fetch(`${API_BASE_URL}/screen_layouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          screen_layout: screenLayoutData,
          screen_meta_data: frontendScene,
          screen_id: screenId,
          sl_row_num_tot: totalRows,
          sl_col_num_tot: totalColumns,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error submitting screen layout:", error);
      throw error;
    }
  }

  static async updateScreenLayout(
    screenLayoutData: unknown,
    totalRows: number,
    totalColumns: number,
    screenId: unknown,
    frontendScene: unknown,
  ): Promise<unknown> {
    console.log("=== updateScreenLayout called ===");
    console.log("screenLayoutData:", screenLayoutData);
    console.log("totalRows:", totalRows);
    console.log("totalColumns:", totalColumns);
    console.log("screenId:", screenId);
    console.log("screenId type:", typeof screenId);
    console.log("frontendScene:", frontendScene);
    try {
      const response = await fetch(
        `${API_BASE_URL}/screen_layouts/${screenId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            screen_layout: screenLayoutData,
            screen_meta_data: frontendScene,
            screen_id: screenId,
            sl_row_num_tot: totalRows,
            sl_col_num_tot: totalColumns,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error submitting screen layout:", error);
      throw error;
    }
  }

  static async getScreenLayout(screenId: unknown): Promise<unknown> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/screen_layouts/${screenId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImNmNjE3MmFjLTc0OGItNDQ4Ni1hZDFiLWMzMjc2ZTg0MzRjNCIsImlhdCI6MTc2NTI3MzkxMywiZXhwIjoxNzY3ODY1OTEzfQ.Dv1FIqcaxAlyuuq1gLMMDUVK9j_WVMNYDFZQnBUDnrA
            `,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error fetching screen layout:", error);
      throw error;
    }
  }

  static async getAllScreenLayouts(): Promise<unknown> {
    try {
      const response = await fetch(`${API_BASE_URL}/active-list/screens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableName: "screens",
          activekey: "screen_is_active",
          conditionColName: "cinema_id",
          conditionId: 10,
          limit: 10,
          currentPage: 1,
          status: "Active",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error updating screen layout:", error);
      throw error;
    }
  }

  static async getSeatTypes(screenId: unknown): Promise<unknown> {
    // admin/tablelist/screen_seat_type?sst_is_active=Y&screen_id=36
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/tablelist/screen_seat_type?sst_is_active=Y&screen_id=${screenId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6ImNmNjE3MmFjLTc0OGItNDQ4Ni1hZDFiLWMzMjc2ZTg0MzRjNCIsImlhdCI6MTc2NTI3MzkxMywiZXhwIjoxNzY3ODY1OTEzfQ.Dv1FIqcaxAlyuuq1gLMMDUVK9j_WVMNYDFZQnBUDnrA
            `,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error fetching seat types:", error);
      throw error;
    }
  }

  static async getSeatLayout(): Promise<unknown> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/external/seat-layout/get-seat-layout/a40f4ea1-3a7e-4ab4-9dd6-4877a3df7fcf/48`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // "X-Access-Key-Secret": `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkaXN0cmlidXRvcl9pZCI6MSwiYXBpX2tleSI6InRlc3QgYXBpIGtleSIsImp0aSI6IjdhODc2OGQ0LTcyMDgtNDI0ZS04ZDllLWRhNWY3ZWVjNzA1OCIsImlhdCI6MTc3NTU2MTQzNX0.kOGQ7JT3e_tB3oE_0IYCNyVgAuAXX7tyMQt3eZTcGkI`,
          }
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return (result as any).data;
    } catch (error) {
      console.error("Error fetching seat layout:", error);
      throw error;
    }
  }
}

export default ApiService;
///eqnjenfjnjk
// jnjjkasasdadasasdd
// --- IGNORE ---