import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  storeItem(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  };

  getItem(key: string) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  };

  storeEvents(events: any[]) {
    const existingEvents = this.getItem('events');
    events = [...existingEvents, ...events];
    this.storeItem('events', events);
  }

  getEvents() {
    return this.getItem('events');
  }

  deleteEvent(eventId: string) {
    const events = this.getItem('events');
    const updatedEvents = events.filter((event: any) => event.event_id !== eventId);
    this.storeItem('events', updatedEvents);
  }
}
