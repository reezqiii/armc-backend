import { Injectable } from "@nestjs/common";
const SftpClient = require("ssh2-sftp-client");

@Injectable()
export class SftpService {
  async uploadFile(localPath: string, remotePath: string) {
    const sftp = new SftpClient();

    const config = {
      host: process.env.FTP_SINOLOGI_HOST,
      port: 22,
      username: process.env.FTP_SINOLOGI_USER,
      password: process.env.FTP_SINOLOGI_PASS,
    };

    try {
      await sftp.connect(config);
      await sftp.put(localPath, remotePath);
      await sftp.end();
      return { success: true };
    } catch (err) {
      try {
        await sftp.end();
      } catch {}
      console.error("SFTP ERROR:", err.message);
      throw err;
    }
  }

  async downloadFile(remotePath: string) {
    const sftp = new SftpClient();

    const config = {
      host: process.env.FTP_SINOLOGI_HOST,
      port: 22,
      username: process.env.FTP_SINOLOGI_USER,
      password: process.env.FTP_SINOLOGI_PASS,
    };

    try {
      await sftp.connect(config);

      const file = await sftp.get(remotePath);

      await sftp.end();

      return file;
    } catch (err) {
      try {
        await sftp.end();
      } catch {}

      console.error("SFTP DOWNLOAD ERROR:", err.message);
      throw err;
    }
  }

  async deleteFile(remotePath: string) {
    const sftp = new SftpClient();

    const config = {
      host: process.env.FTP_SINOLOGI_HOST,
      port: 22,
      username: process.env.FTP_SINOLOGI_USER,
      password: process.env.FTP_SINOLOGI_PASS,
    };

    try {
      await sftp.connect(config);

      const exists = await sftp.exists(remotePath);
      if (!exists) {
        await sftp.end();
        return { success: true, skipped: true };
      }

      await sftp.delete(remotePath);
      await sftp.end();
      return { success: true };
    } catch (err) {
      try {
        await sftp.end();
      } catch {}
      console.error("SFTP DELETE ERROR:", err.message);
      throw err;
    }
  }

  async exists(remotePath: string) {
    const sftp = new SftpClient();
    const config = {
      host: process.env.FTP_SINOLOGI_HOST,
      port: 22,
      username: process.env.FTP_SINOLOGI_USER,
      password: process.env.FTP_SINOLOGI_PASS,
    };

    try {
      await sftp.connect(config);
      return await sftp.exists(remotePath); 
    } finally {
      try {
        await sftp.end();
      } catch {}
    }
  }
}
