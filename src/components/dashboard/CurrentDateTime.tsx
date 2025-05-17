
"use client";

import { useState, useEffect } from 'react';
import { CalendarDays, Clock } from 'lucide-react';

export function CurrentDateTime() {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial date/time on client mount to avoid hydration mismatch
    setCurrentDateTime(new Date());

    const timerId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timerId); // Cleanup interval on component unmount
    };
  }, []);

  if (!currentDateTime) {
    return (
      <div className="flex items-center text-sm text-muted-foreground mb-4 p-3 bg-card rounded-lg shadow">
        <CalendarDays className="mr-2 h-4 w-4" />
        <span>Memuat tanggal & waktu...</span>
      </div>
    );
  }

  const optionsDate: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = currentDateTime.toLocaleDateString('id-ID', optionsDate);
  const formattedTime = currentDateTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground mb-6 p-3 bg-card rounded-lg shadow">
      <div className="flex items-center mb-2 sm:mb-0">
        <CalendarDays className="mr-2 h-5 w-5 text-primary" />
        <span className="font-medium">{formattedDate}</span>
      </div>
      <div className="flex items-center">
        <Clock className="mr-2 h-5 w-5 text-primary" />
        <span className="font-medium text-lg">{formattedTime}</span>
      </div>
    </div>
  );
}
