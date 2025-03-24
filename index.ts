import { SQL } from "bun";

if (!process.env.DATABASE_URL) {
  throw new Error("No database url");
}
if (!process.env.COMMANDO_URL) {
  throw new Error("No commando url");
}
if (!process.env.TEST_PWD) {
  throw new Error("No test pwd");
}

console.log("Connecting to db...");
const sql = new SQL(process.env.DATABASE_URL);

console.log("Getting usernames...");
const usernames = await sql`SELECT email FROM public.driver`.values();

console.log("Starting tests...");
const failedLogins = await Promise.all(
  usernames.map(async (username: string[]) => {
    const response = await fetch(process.env.COMMANDO_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: username[0],
        password: process.env.TEST_PWD,
      }),
    });

    const result = await response.json();

    if (result.status === "401") {
      return username[0];
    }
    return null;
  })
);

const result = failedLogins.filter((user) => !!user);
console.log(result);
console.log("Writing results to /output...");
await Bun.write("./output.json", JSON.stringify(result, null, 2));
console.log(`Done! Found ${result.length} users without the pwd.`);
