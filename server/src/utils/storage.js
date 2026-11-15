const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

// Extract project reference from DB URL if SUPABASE_URL is not explicitly set
function extractSupabaseUrl() {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || "";
  // Check pattern postgresql://postgres.[ref]:... or db.[ref].supabase.co
  const poolerMatch = dbUrl.match(/postgres\.([a-zA-Z0-9_-]+):/);
  if (poolerMatch) return `https://${poolerMatch[1]}.supabase.co`;

  const directMatch = dbUrl.match(/db\.([a-zA-Z0-9_-]+)\.supabase\.co/);
  if (directMatch) return `https://${directMatch[1]}.supabase.co`;

  return null;
}

const supabaseUrl = extractSupabaseUrl();
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY;
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "parcel-photos";

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  console.log(`☁️ Supabase Storage initialized (Bucket: "${BUCKET_NAME}")`);
} else {
  console.log("ℹ️ Supabase Storage keys not provided, using local uploads fallback");
}

let bucketEnsured = false;
async function ensureBucket() {
  if (!supabase || bucketEnsured) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
      });
      console.log(`✅ Created public Supabase Storage bucket: "${BUCKET_NAME}"`);
    }
    bucketEnsured = true;
  } catch (err) {
    // If permission prevents listing or creating, continue and try upload directly
    bucketEnsured = true;
  }
}

/**
 * Upload a file buffer to Supabase Storage (with local disk fallback).
 * @param {Object} file - Multer file object with buffer, originalname, mimetype
 * @returns {Promise<string>} Public URL of the uploaded file
 */
async function uploadFile(file) {
  const ext = (path.extname(file.originalname) || ".jpg").toLowerCase();
  const filename = `parcel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

  if (supabase) {
    try {
      await ensureBucket();

      const filePath = `parcels/${filename}`;
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype || "image/jpeg",
          upsert: true,
        });

      if (error) {
        // If bucket didn't exist, try creating it once and retry upload
        if (error.message?.includes("Bucket not found") || error.statusCode === "404") {
          await supabase.storage.createBucket(BUCKET_NAME, { public: true });
          const retry = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file.buffer, {
              contentType: file.mimetype || "image/jpeg",
              upsert: true,
            });
          if (retry.error) throw retry.error;
        } else {
          throw error;
        }
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (supabaseErr) {
      console.error("⚠️ Supabase Storage upload error:", supabaseErr.message || supabaseErr);
      console.warn("Falling back to local disk storage for this file.");
    }
  }

  // Fallback to local storage (e.g. offline development or missing storage credentials)
  const uploadsDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const diskPath = path.join(uploadsDir, filename);
  fs.writeFileSync(diskPath, file.buffer);
  return `/uploads/${filename}`;
}

module.exports = { uploadFile, BUCKET_NAME };
