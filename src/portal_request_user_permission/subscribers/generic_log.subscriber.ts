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

    const changedFields = {};

    event.updatedColumns.forEach(col => {
      const key = col.propertyName;

      const oldValue = event.databaseEntity?.[key];
      const newValue = event.entity?.[key];

      if (oldValue !== newValue) {
        changedFields[key] = {
          before: oldValue,
          after: newValue,
        };
      }
    });

    if (Object.keys(changedFields).length === 0) return;

    const log = new LogPortalEntity();
    log.table = 'portal_request_user_permission';
    log.index = event.entity?.id_request || null;

    log.before = JSON.stringify(
      Object.fromEntries(
        Object.entries(changedFields).map(([k, v]: [string, any]) => [k, v.before])
      )
    );

    log.after = JSON.stringify(
      Object.fromEntries(
        Object.entries(changedFields).map(([k, v]: [string, any]) => [k, v.after])
      )
    );

    log.user = userId;
    log.date = new Date();
    log.type = 1;
    log.id_application = 31;

    await this.almsDataSource.manager.save(LogPortalEntity, log);
  }

  async afterInsert(event: InsertEvent<RequestEntity>) {
    const userId = requestStorage.getStore()?.userId || null;
    const log = new LogPortalEntity();
    log.table = 'portal_request_user_permission';
    log.index = event.entity?.id_request || null;
    log.before = null;
    log.after = JSON.stringify(event.entity);
    log.user = userId;
    log.date = new Date();
    log.type = 2; // Insert
    log.id_application = 31;

    await this.almsDataSource.manager.save(LogPortalEntity, log);
  }

  async afterRemove(event: RemoveEvent<RequestEntity>) {
    const userId = requestStorage.getStore()?.userId || null;
    const log = new LogPortalEntity();
    log.table = 'portal_request_user_permission';
    log.index = event.entityId as number;
    log.before = JSON.stringify(event.databaseEntity);
    log.after = null;
    log.user = userId;
    log.date = new Date();
    log.type = 3; // Delete
    log.id_application = 31;

    await this.almsDataSource.manager.save(LogPortalEntity, log);
  }
}
