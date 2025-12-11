import { Injectable } from '@nestjs/common';
import { LogPortalEntity } from 'log_portal/log_portal.entity';
import { RequestEntity } from 'portal_request_user_permission/request.entity';
import { DataSource, EntitySubscriberInterface, UpdateEvent, InsertEvent, RemoveEvent } from 'typeorm';
import { requestStorage } from './async_local_storage';
import { InjectDataSource } from '@nestjs/typeorm';



@Injectable()
export class RequestSubscriber implements EntitySubscriberInterface<RequestEntity> {
  constructor(
    @InjectDataSource('alms')
    private readonly almsDataSource: DataSource,
    @InjectDataSource('db_iss')
    private readonly issDataSource: DataSource,

    @InjectDataSource() // default DB
    private readonly defaultDataSource: DataSource,
  ) {

    this.defaultDataSource.subscribers.push(this);
  }

  listenTo() {
    return RequestEntity;
  }

  async afterUpdate(event: UpdateEvent<RequestEntity>) {
    const userId = requestStorage.getStore()?.userId || null;

    const dbEntity = event.databaseEntity;
    const newEntity = event.entity;

    if (!dbEntity || !newEntity) return;

    const ignoreKeys = [
      'created_date',
      'updated_date',
      'approval_hod_by',
      'approval_lead_it_by',
      'approval_it_hod_by',
    ];

    for (const key of Object.keys(newEntity)) {
      if (ignoreKeys.includes(key)) continue;

      const oldValue = await this.mapValueByColumn(key, dbEntity[key]);
      const newValue = await this.mapValueByColumn(key, newEntity[key]);

      // skip jika sama
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;

      // SAVE LOG
      const log = new LogPortalEntity();
      log.table = 'portal_request_user_permission';
      log.index = newEntity.id_request;

      log.before = oldValue;
      log.after = newValue;

      log.user = userId;
      log.date = new Date();
      log.type = 1;
      log.id_application = 31;

      await this.almsDataSource.manager.save(LogPortalEntity, log);
    }
  }

  async afterInsert(event: InsertEvent<RequestEntity>) {
    const userId = requestStorage.getStore()?.userId || null;

    const log = new LogPortalEntity();
    log.table = 'portal_request_user_permission';
    log.index = event.entity?.id_request;
    log.before = null;
    log.after = event.entity; // SAVE AS JSON
    log.user = userId;
    log.date = new Date();
    log.type = 2;
    log.id_application = 31;

    await this.almsDataSource.manager.save(LogPortalEntity, log);
  }

  async afterRemove(event: RemoveEvent<RequestEntity>) {
    const userId = requestStorage.getStore()?.userId || null;

    const log = new LogPortalEntity();
    log.table = 'portal_request_user_permission';
    log.index = event.entityId;
    log.before = event.databaseEntity; // JSON
    log.after = null;
    log.user = userId;
    log.date = new Date();
    log.type = 3;
    log.id_application = 31;

    await this.almsDataSource.manager.save(LogPortalEntity, log);
  }

  private async mapValueByColumn(key: string, value: any): Promise<any> {
    if (value === null || value === undefined) return value;

    // USER
    if (['approval_hod_by', 'approval_it_hod_by', 'approval_lead_it_by', 'created_by'].includes(key)) {
      const res = await this.defaultDataSource.query(
        `SELECT full_name FROM portal_user_db WHERE id_user = $1 LIMIT 1`,
        [value]
      );
      return res?.[0]?.full_name || value;
    }

    // COMPANY
    if (key === 'id_company') {
      const res = await this.defaultDataSource.query(
        `SELECT company_name FROM portal_company WHERE id_company = $1 LIMIT 1`,
        [value]
      );
      return res?.[0]?.company_name || value;
    }

    // DEPARTMENT
    if (key === 'dept_id') {
      const res = await this.issDataSource.query(
        `SELECT dept FROM iss_dept WHERE dept_id = $1 LIMIT 1`,
        [value]
      );
      return res?.[0]?.dept || value;
    }

    // DESIGN
    if (key === 'design_id') {
      const res = await this.issDataSource.query(
        `SELECT design_desc FROM iss_design_new WHERE design_id = $1 LIMIT 1`,
        [value]
      );
      return res?.[0]?.design_desc || value;
    }

    // PROJECT
    if (key === 'project_id') {
      const res = await this.issDataSource.query(
        `SELECT project_desc FROM iss_project WHERE project_id = $1 LIMIT 1`,
        [value]
      );
      return res?.[0]?.project_desc || value;
    }

    // NAV MENU
    if (key === 'access_nav_menu') {
      if (!value) return value;

      const ids = value.split(',').map(v => Number(v.trim())).filter(Boolean);
      if (ids.length === 0) return value;

      const res = await this.defaultDataSource.query(
        `SELECT   application_name FROM portal_nav_menu WHERE id_application = ANY($1)`,
        [ids]
      );

      return res.map(r => r.  application_name).join(', ') || value;
    }

    return value;
  }


}