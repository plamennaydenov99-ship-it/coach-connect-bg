import Availability from '@/pages/dashboard/Availability';
import BookingRequests from '@/pages/dashboard/BookingRequests';

/** Temporary: existing availability + booking requests until the calendar is rebuilt. */
export default function CoachCalendar() {
  return (
    <div className="space-y-10">
      <Availability />
      <BookingRequests />
    </div>
  );
}
