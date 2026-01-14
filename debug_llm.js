const rawOutput = `{
  "status": "success",
  "data": {
    "id": "usr_99",
    "action": "completed"
  }}
}`; // notice the extra closing bracket

console.log("LOG [2026-01-15 14:02:11] Received from model...");
console.log(rawOutput);
console.log("\nLOG [2026-01-15 14:02:12] Attempting to parse...");

JSON.parse(rawOutput);
