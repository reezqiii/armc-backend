import { Injectable } from '@nestjs/common';
import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { asyncLocalStorage } from './async_local_storage';
import { LogPortalEntity } from 'log_portal/log_portal.entity';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
@EventSubscriber()
export class GenericLogSubscriber implements EntitySubscriberInterface<any> {
  constructor(@InjectDataSource('alms') private dataSource: DataSource) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Object; // atau entity tertentu jika ingin spesifik
  }

  private getUserId() {
    return asyncLocalStorage.getStore()?.get('userId') || null;
  }

  private async saveLog(event: {
    type: number;
    before?: any;
    after?: any;
    entity: any;
    table: string;
  }) {
    const logRepo = this.dataSource.getRepository(LogPortalEntity);

    let entityId = event.entity?.id ?? event.entity?.id_user ?? null;

    await logRepo.save({
      table: event.table,
      index: entityId,
      before: event.before ? JSON.stringify(event.before) : null,
      after: event.after ? JSON.stringify(event.after) : null,
      user: this.getUserId(),
      date: new Date(),
      type: event.type,
      id_application: 1,
    });
  } catch(err) {
    console.error('Failed to save log:', err);
  }

  async afterInsert(event: InsertEvent<any>) {
    if (!event.entity) return;

    const entityId = event.metadata.primaryColumns.map(
      col => event.entity[col.propertyName]
    )[0];

    await this.saveLog({
      type: 2,
      after: event.entity,
      entity: event.entity,
      table: event.metadata.tableName,
    });
  }

  async afterUpdate(event: UpdateEvent<any>) {
    if (!event.entity) return; // safety check

    const entityId = event.metadata.primaryColumns.map(
      col => event.entity[col.propertyName]
    )[0];

    await this.saveLog({
      type: 1,
      before: event.databaseEntity,
      after: event.entity,
      entity: event.entity,
      table: event.metadata.tableName,
    });
  }

  async afterRemove(event: RemoveEvent<any>) {
    const entityId = event.entity
      ? event.metadata.primaryColumns.map(col => event.entity[col.propertyName])[0]
      : event.entityId; // RemoveEvent punya entityId

    await this.saveLog({
      type: 3,
      before: event.entity,
      entity: event.entity,
      table: event.metadata.tableName,
    });
  }
}
