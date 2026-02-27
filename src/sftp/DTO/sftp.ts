export class ServerSideSftpDTO {
  id_request: string;
  page?: number = 0;
  size?: number = 10;
  sort_by?: string = "upload_date";
  sort_order?: "ASC" | "DESC" = "DESC";
  search?: string = "";
}
