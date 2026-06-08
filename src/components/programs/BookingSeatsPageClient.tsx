"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import BookingSeatsClient from "@/components/programs/BookingSeatsClient";
import { useExternalEventDetails } from "@/contexts/program-event/ExternalEventDetailsContext";

type BookingSeatsPageClientProps = {
  locale: string;
  eventName: string;
  eventId: string;
  scheduleRouteId: string;
};

export default function BookingSeatsPageClient({
  locale,
  eventName,
  eventId,
  scheduleRouteId,
}: BookingSeatsPageClientProps) {
  const externalEventDetails = useExternalEventDetails();
  // console.log('externalEventDetails', externalEventDetails);

  const selectedTimeSlot = useMemo(() => {
    const schedulesRaw = externalEventDetails.schedules;
    const schedules: Array<{
      event_config_id?: number;
      schedule_id?: number;
      date?: string;
      chart_id?: string;
      time_slot?: { start_time?: string; end_time?: string };
    }> = Array.isArray(schedulesRaw) ? (schedulesRaw as any[]) : [];

    return schedules.find((schedule) => schedule.schedule_id === Number(scheduleRouteId));
  }, [externalEventDetails, scheduleRouteId]);

  if (!selectedTimeSlot) {
    notFound();
  }

  return (
    <BookingSeatsClient
      eventName={externalEventDetails.name}
      eventId={eventId}
      eventTitle={externalEventDetails.name}
      eventImageSrc={externalEventDetails.thumbnail_url}
      selectedDateLabel={selectedTimeSlot.date ?? null}
      selectedTime={selectedTimeSlot.time_slot?.start_time ?? null}
      minDateISO={selectedTimeSlot.date ?? null}
      maxDateISO={selectedTimeSlot.date ?? null}
      timeSlots={[selectedTimeSlot.time_slot?.start_time ?? ""]}
      backToSeatsHref={`/${locale}/season/${eventName}/${eventId}/booking/seats`}
      eventDetailHref={`/${locale}/season/${eventName}/${eventId}`}
      eventConfigId={Number(selectedTimeSlot.event_config_id ?? 0)}
      scheduleId={Number(selectedTimeSlot.schedule_id ?? 0)}
      chartId={selectedTimeSlot.chart_id ?? ""}
    />
  );
}
