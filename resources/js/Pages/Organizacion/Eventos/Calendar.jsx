import React from 'react';
import FullCalendar from '@fullcalendar/react';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

export default function CalendarPage({ events = [] }) {
  const fcEvents = (events || []).map(e => ({
    id: e.id,
    title: e.title,
    start: e.start || null,
    end: e.end || null,
    extendedProps: { resource: e },
  }));

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Calendario de eventos</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        locales={[esLocale]}
        locale="es"
        events={fcEvents}
        height={600}
        selectable={false}
      />
    </div>
  );
}