const EID_DATE = "2026-03-20";
const CURRENT_TIME = "2026-03-18T21:56:44+03:00";

// Simulate the current environment
const mockNow = new Date(CURRENT_TIME);
console.log("Current Time (Local):", mockNow.toLocaleString());

const todayAtMidnight = new Date(mockNow).setHours(0, 0, 0, 0);

// Old logic (potentially UTC)
const eidDateOld = new Date(EID_DATE);
const diffTimeOld = eidDateOld - todayAtMidnight;
const diffDaysOld = Math.ceil(diffTimeOld / (1000 * 60 * 60 * 24));

console.log("Old Logic Eid Date (ISO):", eidDateOld.toISOString());
console.log("Old Logic Days Remaining:", diffDaysOld);

// New logic (forced local)
const eidDateNew = new Date(EID_DATE + 'T00:00:00');
const diffTimeNew = eidDateNew - todayAtMidnight;
const diffDaysNew = Math.ceil(diffTimeNew / (1000 * 60 * 60 * 24));

console.log("New Logic Eid Date (String):", eidDateNew.toString());
console.log("New Logic Days Remaining (Math.ceil):", diffDaysNew);

// Even safer: use year, month, day directly
const [y, m, d] = EID_DATE.split('-').map(Number);
const eidDateSafe = new Date(y, m - 1, d);
const diffTimeSafe = eidDateSafe - todayAtMidnight;
const diffDaysSafe = Math.round(diffTimeSafe / (1000 * 60 * 60 * 24));

console.log("Safe Logic Days Remaining (Math.round):", diffDaysSafe);
