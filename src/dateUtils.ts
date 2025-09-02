export const getDateInfo = () => {
  const now = new Date();
  
  // Year for quarterly and yearly
  const year = now.getFullYear();
  
  // Quarter
  const month = now.getMonth() + 1; // getMonth() returns 0-11
  const quarter = Math.ceil(month / 3);
  const quarterName = `Q${quarter} ${year}`;
  
  // Month name
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  
  // Week calculation - week of the month
  const firstDayOfMonth = new Date(year, now.getMonth(), 1);
  const dayOfMonth = now.getDate();
  const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
  const weekName = `Week ${weekOfMonth}`;
  
  // Today's date
  const today = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Yearly
  const yearName = year.toString();
  
  return {
    yearly: yearName,
    quarterly: quarterName,
    monthly: monthName,
    weekly: weekName,
    daily: today
  };
};