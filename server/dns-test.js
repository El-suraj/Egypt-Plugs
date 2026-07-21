const dns = require("dns");

dns.setServers(["8.8.8.8"]);

dns.lookup("db.ekzmhtxbnbxwpqyukliz.supabase.co", (err, address, family) => {
  console.log("lookup error:", err && err.message);
  console.log("address:", address, "family:", family);
});

dns.resolve4("db.ekzmhtxbnbxwpqyukliz.supabase.co", (err, addresses) => {
  console.log("resolve4 error:", err && err.message);
  console.log("resolve4:", addresses);
});
